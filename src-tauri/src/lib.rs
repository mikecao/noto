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
