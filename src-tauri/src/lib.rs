use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let migrations = vec![
    Migration {
      version: 1,
      description: "create notes table",
      sql: "CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 2,
      description: "add pinned column",
      sql: "ALTER TABLE notes ADD COLUMN pinned INTEGER NOT NULL DEFAULT 0",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 3,
      description: "add deleted_at column",
      sql: "ALTER TABLE notes ADD COLUMN deleted_at INTEGER DEFAULT NULL",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 4,
      description: "add starred column",
      sql: "ALTER TABLE notes ADD COLUMN starred INTEGER NOT NULL DEFAULT 0",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 5,
      description: "drop pinned column",
      sql: "ALTER TABLE notes DROP COLUMN pinned",
      kind: MigrationKind::Up,
    },
    Migration {
      version: 6,
      description: "convert id to uuid",
      sql: "
        -- Create new table with TEXT id
        CREATE TABLE notes_new (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT NOT NULL DEFAULT '',
          content TEXT NOT NULL DEFAULT '',
          starred INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          deleted_at INTEGER DEFAULT NULL
        );
        -- Copy existing notes with UUID conversion (using hex of random bytes as UUID-like string)
        INSERT INTO notes_new (id, title, content, starred, created_at, updated_at, deleted_at)
        SELECT
          lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
          title, content, starred, created_at, updated_at, deleted_at
        FROM notes;
        -- Drop old table
        DROP TABLE notes;
        -- Rename new table
        ALTER TABLE notes_new RENAME TO notes;
      ",
      kind: MigrationKind::Up,
    }
  ];

  tauri::Builder::default()
    .plugin(tauri_plugin_http::init())
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:noto.db", migrations)
        .build(),
    )
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
