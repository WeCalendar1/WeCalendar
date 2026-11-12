"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CalendarEvent } from "@/lib/events";
import { noteTitle, type Note } from "@/lib/notes";
import {
  eventsForPlace,
  filterPlaces,
  labelPhotonFeature,
  notesForPlace,
  photonReverseUrl,
  photonSearchUrl,
  PLACE_KIND_COLOR,
  PLACE_KIND_LABEL,
  PLACE_KINDS,
  type MapBias,
  type PhotonFeature,
  type Place,
  type PlaceKind,
} from "@/lib/places";

type LocationStatus = "unknown" | "ready" | "denied" | "unavailable";

type MapFilter = "all" | PlaceKind | "events";

type DraftPin = {
  lat: number;
  lng: number;
  name: string;
  address: string;
  kind: PlaceKind;
};

type MapAppProps = {
  groupId: string | null;
  places: Place[];
  events: CalendarEvent[];
  notes: Note[];
  onCreatePlace: (input: {
    name: string;
    address: string | null;
    lat: number;
    lng: number;
    kind: PlaceKind;
  }) => Promise<void>;
  onUpdatePlace: (placeId: string, patch: { name?: string; kind?: PlaceKind }) => Promise<void>;
  onDeletePlace: (placeId: string) => Promise<void>;
  onPlanEvent: (placeId: string) => void;
  onOpenEvent: (event: CalendarEvent) => void;
  onOpenNote: (noteId: string) => void;
  onCreateNote: (placeId: string) => Promise<void>;
  onOpenWorkspaceModal?: () => void;
};

export function MapApp({
  groupId,
  places,
  events,
  notes,
  onCreatePlace,
  onUpdatePlace,
  onDeletePlace,
  onPlanEvent,
  onOpenEvent,
  onOpenNote,
  onCreateNote,
  onOpenWorkspaceModal,
}: MapAppProps) {
  const [filter, setFilter] = useState<MapFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftPin | null>(null);
  const [search, setSearch] = useState("");
  const [hits, setHits] = useState<{ label: string; lat: number; lng: number; name: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("unknown");
  const [reversePending, setReversePending] = useState(false);
  const searchSeqRef = useRef(0);
  const reverseSeqRef = useRef(0);
  const userBiasRef = useRef<MapBias | null>(null);
  const [activeGroupKey, setActiveGroupKey] = useState<string | null>(groupId);

  if (groupId !== activeGroupKey) {
    setActiveGroupKey(groupId);
    setSelectedId(null);
    setDraft(null);
    setError(null);
    setHits([]);
  }

  const eventPlaceIds = useMemo(
    () => new Set(events.map((e) => e.place_id).filter((id): id is string => Boolean(id))),
    [events],
  );
  const visible = useMemo(
    () => filterPlaces(places, filter, eventPlaceIds),
    [places, filter, eventPlaceIds],
  );
  const selected = places.find((p) => p.id === selectedId) ?? null;

  function handleMapClick(lat: number, lng: number) {
    setSelectedId(null);
    setDraft({ lat, lng, name: "", address: "", kind: "favorite" });
    void reverseGeocodeClick(lat, lng);
  }

  async function reverseGeocodeClick(lat: number, lng: number) {
    const seq = ++reverseSeqRef.current;
    setReversePending(true);
    try {
      const res = await fetch(photonReverseUrl(lat, lng));
      if (!res.ok || seq !== reverseSeqRef.current) return;
      const json = (await res.json()) as { features?: PhotonFeature[] };
      const feature = json.features?.[0];
      if (!feature || seq !== reverseSeqRef.current) return;
      const labeled = labelPhotonFeature(feature);
      setDraft((prev) => {
        if (!prev || prev.lat !== lat || prev.lng !== lng) return prev;
        return {
          ...prev,
          name: prev.name.trim() ? prev.name : labeled.name,
          address: prev.address.trim() ? prev.address : labeled.address,
        };
      });
    } catch {
      /* leave the draft blank so the user can name it */
    } finally {
      if (seq === reverseSeqRef.current) setReversePending(false);
    }
  }

  async function saveDraft() {
    if (!draft || !draft.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onCreatePlace({
        name: draft.name.trim(),
        address: draft.address.trim() || null,
        lat: draft.lat,
        lng: draft.lng,
        kind: draft.kind,
      });
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save place.");
    } finally {
      setBusy(false);
    }
  }

  async function searchPlaces(query: string) {
    const seq = ++searchSeqRef.current;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    try {
      const res = await fetch(photonSearchUrl(q, userBiasRef.current));
      if (!res.ok || seq !== searchSeqRef.current) return;
      const json = (await res.json()) as { features?: PhotonFeature[] };
      if (seq !== searchSeqRef.current) return;
      setHits(
        (json.features ?? []).map((f) => {
          const labeled = labelPhotonFeature(f);
          return { ...labeled, label: labeled.address };
        }),
      );
    } catch {
      if (seq === searchSeqRef.current) {
        setHits([]);
      }
    }
  }

  if (!groupId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          Join a workspace to use Map
        </p>
        <p className="mt-2 max-w-sm text-sm" style={{ color: "var(--text-secondary)" }}>
          Shared pins live on the same calendar as events and notes.
        </p>
        {onOpenWorkspaceModal && (
          <button
            type="button"
            onClick={onOpenWorkspaceModal}
            className="pressable mt-4 cursor-pointer px-4 py-2 text-sm font-semibold text-white"
            style={{ borderRadius: "var(--radius-full)", background: "var(--accent)" }}
          >
            Create or join workspace
          </button>
        )}
      </div>
    );
  }

  const linkedEvents = selected ? eventsForPlace(events, selected.id) : [];
  const linkedNotes = selected ? notesForPlace(notes, selected.id) : [];

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden p-3 sm:p-4">
      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{
          borderRadius: "var(--radius-xl)",
          border: "1.5px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div
          className="flex flex-wrap items-center gap-2 px-3 py-2"
          style={{ borderBottom: "0.5px solid var(--separator)", background: "var(--surface-2)" }}
        >
          <div className="relative min-w-[12rem] flex-1">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                void searchPlaces(e.target.value);
              }}
              placeholder="Search a place…"
              className="w-full px-3 py-1.5 text-sm outline-none"
              style={{
                borderRadius: "var(--radius-full)",
                background: "var(--surface)",
                boxShadow: "inset 0 0 0 0.5px var(--hairline)",
                color: "var(--foreground)",
              }}
            />
            {hits.length > 0 && (
              <ul
                className="absolute z-20 mt-1 w-full overflow-hidden py-1 text-sm"
                style={{
                  borderRadius: "var(--radius-lg)",
                  background: "var(--surface)",
                  boxShadow: "var(--shadow-md)",
                }}
              >
                {hits.map((hit) => (
                  <li key={`${hit.lat},${hit.lng},${hit.label}`}>
                    <button
                      type="button"
                      className="w-full px-3 py-1.5 text-left hover:bg-[var(--accent-muted)]"
                      onClick={() => {
                        setSearch(hit.label);
                        setHits([]);
                        setSelectedId(null);
                        setDraft({
                          lat: hit.lat,
                          lng: hit.lng,
                          name: hit.name,
                          address: hit.label,
                          kind: "want_to_go",
                        });
                      }}
                    >
                      {hit.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="segmented" role="group" aria-label="Place filters">
            {(
              [
                { id: "all" as const, label: "All" },
                { id: "favorite" as const, label: "Favorites" },
                { id: "want_to_go" as const, label: "Want to go" },
                { id: "events" as const, label: "Events" },
              ]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                className="segmented-item pressable"
                data-active={filter === opt.id}
                onClick={() => setFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {(locationStatus === "denied" || locationStatus === "unavailable") && (
            <p className="basis-full text-xs" style={{ color: "var(--text-muted)" }}>
              {locationStatus === "denied"
                ? "Location is off. Allow it in the browser to show where you are."
                : "Couldn't find your location. Try the locate button again."}
            </p>
          )}
        </div>

        <div className="relative min-h-0 flex-1">
          <MapCanvas
            groupId={groupId}
            places={visible}
            selectedId={selectedId}
            draft={draft}
            onSelectPlace={(id) => {
              setDraft(null);
              setSelectedId(id);
            }}
            onMapClick={handleMapClick}
            onUserLocation={(bias) => {
              userBiasRef.current = bias;
            }}
            onLocationStatus={setLocationStatus}
            locationStatus={locationStatus}
            flyTo={draft ? { lat: draft.lat, lng: draft.lng } : selected}
          />
        </div>

        {(draft || selected) && (
          <div
            className="absolute right-3 bottom-3 left-3 z-10 max-w-md space-y-2 p-3 sm:right-auto"
            style={{
              borderRadius: "var(--radius-xl)",
              background: "var(--glass-bg-heavy)",
              backdropFilter: "var(--glass-blur-heavy)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            {error && (
              <p className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>
                {error}
              </p>
            )}
            {draft ? (
              <>
                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  New pin · click the map to move
                </p>
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Name"
                  className="w-full px-3 py-2 text-sm outline-none"
                  style={{
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                  }}
                />
                {draft.address ? (
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {draft.address}
                  </p>
                ) : reversePending ? (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Looking up address…
                  </p>
                ) : null}
                <div className="flex gap-2">
                  {PLACE_KINDS.map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      className="pressable flex-1 px-2 py-1.5 text-xs font-semibold"
                      style={{
                        borderRadius: "var(--radius-full)",
                        background: draft.kind === kind ? PLACE_KIND_COLOR[kind] : "var(--surface-2)",
                        color: draft.kind === kind ? "#fff" : "var(--foreground)",
                      }}
                      onClick={() => setDraft({ ...draft, kind })}
                    >
                      {PLACE_KIND_LABEL[kind]}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" className="pressable px-3 py-1.5 text-xs" onClick={() => setDraft(null)}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={busy || !draft.name.trim()}
                    onClick={() => void saveDraft()}
                    className="pressable px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    style={{ borderRadius: "var(--radius-full)", background: "var(--accent)" }}
                  >
                    {busy ? "Saving…" : "Save pin"}
                  </button>
                </div>
              </>
            ) : selected ? (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {selected.name}
                    </p>
                    <p className="text-xs" style={{ color: PLACE_KIND_COLOR[selected.kind] }}>
                      {PLACE_KIND_LABEL[selected.kind]}
                    </p>
                    {selected.address && (
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {selected.address}
                      </p>
                    )}
                  </div>
                  <button type="button" className="pressable text-xs" onClick={() => setSelectedId(null)}>
                    Close
                  </button>
                </div>
                {linkedEvents.length > 0 && (
                  <ul className="space-y-1">
                    {linkedEvents.slice(0, 4).map((event) => (
                      <li key={event.id}>
                        <button
                          type="button"
                          className="pressable w-full rounded-lg px-2 py-1.5 text-left text-xs"
                          style={{ background: "var(--surface-2)" }}
                          onClick={() => onOpenEvent(event)}
                        >
                          {event.title}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {linkedNotes.length > 0 && (
                  <ul className="space-y-1">
                    {linkedNotes.slice(0, 4).map((note) => (
                      <li key={note.id}>
                        <button
                          type="button"
                          className="pressable w-full rounded-lg px-2 py-1.5 text-left text-xs"
                          style={{ background: "var(--surface-2)" }}
                          onClick={() => onOpenNote(note.id)}
                        >
                          {noteTitle(note)}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="pressable px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ borderRadius: "var(--radius-full)", background: "var(--accent)" }}
                    onClick={() => onPlanEvent(selected.id)}
                  >
                    Plan event
                  </button>
                  <button
                    type="button"
                    className="pressable px-3 py-1.5 text-xs font-semibold"
                    style={{ borderRadius: "var(--radius-full)", border: "1px solid var(--border)" }}
                    onClick={() => void onCreateNote(selected.id)}
                  >
                    Add note
                  </button>
                  <select
                    value={selected.kind}
                    onChange={(e) => void onUpdatePlace(selected.id, { kind: e.target.value as PlaceKind })}
                    className="rounded-full px-2 py-1 text-xs"
                    style={{ border: "1px solid var(--border)", background: "var(--surface)" }}
                  >
                    {PLACE_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {PLACE_KIND_LABEL[kind]}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="ml-auto pressable px-2 py-1.5 text-xs"
                    style={{ color: "var(--color-danger)" }}
                    onClick={() => {
                      void onDeletePlace(selected.id);
                      setSelectedId(null);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function MapCanvas({
  groupId,
  places,
  selectedId,
  draft,
  onSelectPlace,
  onMapClick,
  onUserLocation,
  onLocationStatus,
  locationStatus,
  flyTo,
}: {
  groupId: string | null;
  places: Place[];
  selectedId: string | null;
  draft: DraftPin | null;
  onSelectPlace: (id: string) => void;
  onMapClick: (lat: number, lng: number) => void;
  onUserLocation: (bias: MapBias) => void;
  onLocationStatus: (status: LocationStatus) => void;
  locationStatus: LocationStatus;
  flyTo: { lat: number; lng: number } | null;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const userLayerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const userDotRef = useRef<import("leaflet").Marker | null>(null);
  const userAccuracyRef = useRef<import("leaflet").Circle | null>(null);
  const userLatLngRef = useRef<import("leaflet").LatLng | null>(null);
  const lastAccuracyRef = useRef<number | null>(null);
  const userPinnedRef = useRef(false);
  const refreshUserLocationRef = useRef<(center: boolean) => void>(() => {});
  const didFitRef = useRef(false);
  const lastGroupIdRef = useRef<string | null>(groupId);
  const [mapReady, setMapReady] = useState(false);
  const onSelectRef = useRef(onSelectPlace);
  const onClickRef = useRef(onMapClick);
  const onUserLocationRef = useRef(onUserLocation);
  const onLocationStatusRef = useRef(onLocationStatus);

  useEffect(() => {
    if (lastGroupIdRef.current !== groupId) {
      lastGroupIdRef.current = groupId;
      didFitRef.current = false;
    }
  }, [groupId]);

  useEffect(() => {
    onSelectRef.current = onSelectPlace;
    onClickRef.current = onMapClick;
    onUserLocationRef.current = onUserLocation;
    onLocationStatusRef.current = onLocationStatus;
  }, [onSelectPlace, onMapClick, onUserLocation, onLocationStatus]);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    let cancelled = false;
    let map: import("leaflet").Map | null = null;
    let watchId: number | null = null;
    let pendingCenter = false;

    void (async () => {
      const L = await import("leaflet");
      if (cancelled || !hostRef.current) return;
      map = L.map(hostRef.current, { zoomControl: true }).setView([39.8283, -98.5795], 4);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      const layer = L.layerGroup().addTo(map);
      const userLayer = L.layerGroup().addTo(map);
      mapRef.current = map;
      layerRef.current = layer;
      userLayerRef.current = userLayer;

      const geoOptions: PositionOptions = {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 60_000,
      };

      function upsertUserMarker(latlng: import("leaflet").LatLng, accuracyMeters: number) {
        userLatLngRef.current = latlng;
        lastAccuracyRef.current = accuracyMeters;
        const haloMeters = Math.max(accuracyMeters, 24);

        if (userAccuracyRef.current) {
          userAccuracyRef.current.setLatLng(latlng).setRadius(haloMeters);
        } else {
          userAccuracyRef.current = L.circle(latlng, {
            radius: haloMeters,
            color: "#007aff",
            weight: 1,
            opacity: 0.45,
            fillColor: "#007aff",
            fillOpacity: 0.14,
            interactive: false,
          }).addTo(userLayer);
        }

        const label =
          accuracyMeters >= 50
            ? `You are here · about ${Math.round(accuracyMeters)} m`
            : "You are here";

        if (userDotRef.current) {
          userDotRef.current.setLatLng(latlng);
          userDotRef.current.setTooltipContent(label);
        } else {
          const marker = L.marker(latlng, {
            draggable: true,
            autoPan: true,
            keyboard: false,
            zIndexOffset: 1000,
            icon: L.divIcon({
              className: "leaflet-user-location-icon",
              html: '<div class="leaflet-user-location"></div>',
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            }),
            title: "You are here (drag to adjust)",
          });
          marker.bindTooltip(label, { direction: "top", offset: [0, -10] });
          marker.on("click", (ev) => {
            L.DomEvent.stopPropagation(ev);
          });
          marker.on("dragstart", (ev) => {
            L.DomEvent.stopPropagation(ev);
          });
          marker.on("drag", () => {
            const next = marker.getLatLng();
            userLatLngRef.current = next;
            userAccuracyRef.current?.setLatLng(next);
          });
          marker.on("dragend", () => {
            userPinnedRef.current = true;
            const next = marker.getLatLng();
            userLatLngRef.current = next;
            lastAccuracyRef.current = 20;
            userAccuracyRef.current?.setLatLng(next).setRadius(20);
            marker.setTooltipContent("You are here");
            onUserLocationRef.current({ lat: next.lat, lng: next.lng });
          });
          marker.addTo(userLayer);
          userDotRef.current = marker;
        }
        onUserLocationRef.current({ lat: latlng.lat, lng: latlng.lng });
      }

      function applyUserPosition(
        coords: GeolocationCoordinates,
        opts: { force?: boolean; center?: boolean } = {},
      ) {
        if (userPinnedRef.current && !opts.force) return;

        const accuracy = Number.isFinite(coords.accuracy) ? coords.accuracy : 1000;
        const latlng = L.latLng(coords.latitude, coords.longitude);
        const previous = userLatLngRef.current;
        const previousAccuracy = lastAccuracyRef.current;

        if (!opts.force && previous && previousAccuracy != null) {
          const movedMeters = previous.distanceTo(latlng);
          const outsideOldFix = movedMeters > previousAccuracy;
          const tighterFix = accuracy <= previousAccuracy;
          if (!outsideOldFix && !tighterFix) return;
        }

        upsertUserMarker(latlng, accuracy);
        onLocationStatusRef.current("ready");

        if (opts.center || pendingCenter || !didFitRef.current) {
          pendingCenter = false;
          map?.setView(latlng, Math.max(map.getZoom(), 16));
        }
      }

      function startWatch() {
        if (!navigator.geolocation) {
          onLocationStatusRef.current("unavailable");
          return;
        }
        if (watchId != null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            if (cancelled) return;
            applyUserPosition(position.coords);
          },
          (err) => {
            if (cancelled || userLatLngRef.current) return;
            onLocationStatusRef.current(err.code === 1 ? "denied" : "unavailable");
          },
          geoOptions,
        );
      }

      refreshUserLocationRef.current = (center) => {
        userPinnedRef.current = false;
        lastAccuracyRef.current = null;
        pendingCenter = center;
        startWatch();
      };

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        onClickRef.current(e.latlng.lat, e.latlng.lng);
      });

      startWatch();
      if (cancelled && watchId != null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      setMapReady(false);
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      map?.remove();
      mapRef.current = null;
      layerRef.current = null;
      userLayerRef.current = null;
      userDotRef.current = null;
      userAccuracyRef.current = null;
      userLatLngRef.current = null;
      lastAccuracyRef.current = null;
      userPinnedRef.current = false;
      refreshUserLocationRef.current = () => {};
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!mapReady || !map || !layer) return;
    void import("leaflet").then((L) => {
      layer.clearLayers();
      for (const place of places) {
        const marker = L.circleMarker([place.lat, place.lng], {
          radius: place.id === selectedId ? 11 : 8,
          color: PLACE_KIND_COLOR[place.kind],
          fillColor: PLACE_KIND_COLOR[place.kind],
          fillOpacity: 0.9,
          weight: 2,
        });
        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectRef.current(place.id);
        });
        marker.addTo(layer);
      }
      if (draft) {
        L.circleMarker([draft.lat, draft.lng], {
          radius: 9,
          color: "#111",
          fillColor: PLACE_KIND_COLOR[draft.kind],
          fillOpacity: 1,
          weight: 2,
          dashArray: "2 4",
        }).addTo(layer);
      }
      if (places.length > 0 && !didFitRef.current) {
        didFitRef.current = true;
        const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number]));
        map.fitBounds(bounds.pad(0.35));
      }
    });
  }, [mapReady, places, selectedId, draft]);

  useEffect(() => {
    if (!flyTo || !mapRef.current) return;
    mapRef.current.flyTo([flyTo.lat, flyTo.lng], Math.max(mapRef.current.getZoom(), 13), {
      duration: 0.4,
    });
  }, [flyTo]);

  return (
    <div className="relative h-full w-full" style={{ minHeight: 240 }}>
      <div ref={hostRef} className="h-full w-full" />
      <button
        type="button"
        aria-label={
          locationStatus === "denied" ? "Location is off" : "Center on my location"
        }
        className="pressable absolute right-3 bottom-10 z-[500] flex h-9 w-9 items-center justify-center"
        style={{
          borderRadius: "var(--radius-full)",
          background: "var(--surface)",
          boxShadow: "var(--shadow-md)",
          color: "var(--foreground)",
        }}
        onClick={() => {
          refreshUserLocationRef.current(true);
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
      </button>
    </div>
  );
}
