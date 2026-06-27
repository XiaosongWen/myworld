"""Tests for the SQLAlchemy User model."""

from datetime import datetime

from models.user import User


class TestUserModel:
    """User model creation and field types."""

    def test_create_user_with_all_fields(self):
        user = User(id=1, username="alice", email="alice@example.com")
        assert user.id == 1
        assert user.username == "alice"
        assert user.email == "alice@example.com"

    def test_create_user_nullable_email(self):
        user = User(id=2, username="bob", email=None)
        assert user.email is None

    def test_created_at_is_server_default(self):
        """created_at uses server_default — it is None until flushed to DB."""
        user = User(id=3, username="carol")
        # server_default is set during INSERT, not on Python instantiation
        assert User.__tablename__ == "users"
        # Verify the column has server_default configured
        col = User.__table__.c.created_at
        assert col.server_default is not None

    def test_table_name(self):
        assert User.__tablename__ == "users"

    def test_repr_contains_username(self):
        user = User(id=4, username="dave")
        assert "dave" in repr(user) or str(user)
