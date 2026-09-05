from .database import engine, Base
from sqlalchemy import text

def migrate():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        columns = [
            ("title", "VARCHAR(250) NULL"),
            ("category", "VARCHAR(100) NOT NULL DEFAULT 'Regional Folklore'"),
            ("region", "VARCHAR(150) NULL"),
            ("image_url", "VARCHAR(500) NULL"),
            ("admin_notes", "TEXT NULL")
        ]
        for col, col_type in columns:
            try:
                conn.execute(text(f"ALTER TABLE contributions ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column {col}")
            except Exception as e:
                print(f"Column {col} status: {e}")
        try:
            conn.execute(text("ALTER TABLE contributions MODIFY artwork_id INT NULL"))
            conn.commit()
            print("Modified artwork_id to nullable")
        except Exception as e:
            print(f"artwork_id modify status: {e}")

if __name__ == "__main__":
    migrate()
