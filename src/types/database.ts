export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          theme_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          theme_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          theme_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: "owner" | "member";
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: "owner" | "member";
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "group_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          group_id: string;
          title: string;
          description: string | null;
          starts_at: string;
          ends_at: string;
          created_by: string;
          has_conflict: boolean;
          recurrence_group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          title: string;
          description?: string | null;
          starts_at: string;
          ends_at: string;
          created_by: string;
          has_conflict?: boolean;
          recurrence_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          title?: string;
          description?: string | null;
          starts_at?: string;
          ends_at?: string;
          created_by?: string;
          has_conflict?: boolean;
          recurrence_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "events_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lists: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          category: "grocery" | "todo" | "wishlist" | "custom";
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          category?: "grocery" | "todo" | "wishlist" | "custom";
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          name?: string;
          category?: "grocery" | "todo" | "wishlist" | "custom";
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lists_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lists_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      list_items: {
        Row: {
          id: string;
          list_id: string;
          content: string;
          is_checked: boolean;
          sort_order: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          content: string;
          is_checked?: boolean;
          sort_order?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          content?: string;
          is_checked?: boolean;
          sort_order?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey";
            columns: ["list_id"];
            isOneToOne: false;
            referencedRelation: "lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "list_items_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          color: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          color?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          name?: string;
          color?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tags_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      note_folders: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          color: string;
          visibility: "shared" | "private";
          sort_order: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          color?: string;
          visibility?: "shared" | "private";
          sort_order?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          name?: string;
          color?: string;
          visibility?: "shared" | "private";
          sort_order?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "note_folders_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "note_folders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          id: string;
          group_id: string;
          folder_id: string | null;
          event_id: string | null;
          linked_date: string | null;
          title: string;
          content: Json;
          content_format: "tiptap" | "markdown" | "plain";
          visibility: "shared" | "private";
          is_pinned: boolean;
          sort_order: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          folder_id?: string | null;
          event_id?: string | null;
          linked_date?: string | null;
          title?: string;
          content?: Json;
          content_format?: "tiptap" | "markdown" | "plain";
          visibility?: "shared" | "private";
          is_pinned?: boolean;
          sort_order?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          folder_id?: string | null;
          event_id?: string | null;
          linked_date?: string | null;
          title?: string;
          content?: Json;
          content_format?: "tiptap" | "markdown" | "plain";
          visibility?: "shared" | "private";
          is_pinned?: boolean;
          sort_order?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "note_folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notes_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_tags: {
        Row: {
          event_id: string;
          tag_id: string;
        };
        Insert: {
          event_id: string;
          tag_id: string;
        };
        Update: {
          event_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_tags_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_group: {
        Args: { p_name: string };
        Returns: Database["public"]["Tables"]["groups"]["Row"];
      };
      join_group_by_invite: {
        Args: { p_invite_code: string };
        Returns: Database["public"]["Tables"]["groups"]["Row"];
      };
      is_group_member: {
        Args: { p_group_id: string };
        Returns: boolean;
      };
      is_group_owner: {
        Args: { p_group_id: string };
        Returns: boolean;
      };
      is_list_group_member: {
        Args: { p_list_id: string };
        Returns: boolean;
      };
      is_event_group_member: {
        Args: { p_event_id: string };
        Returns: boolean;
      };
      can_view_note_folder: {
        Args: { p_folder_id: string };
        Returns: boolean;
      };
      can_view_note: {
        Args: { p_note_id: string };
        Returns: boolean;
      };
      can_edit_note: {
        Args: { p_note_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
