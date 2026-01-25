"""Add learning paths and companion features

Revision ID: 002
Revises: 001
Create Date: 2024-01-25 15:39:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None

def upgrade():
    # Create companion characters table
    op.create_table(
        'companion_characters',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('arabic_name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('image_url', sa.String(500)),
        sa.Column('animation_url', sa.String(500)),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Add columns to users table
    op.add_column('users', sa.Column('is_guest', sa.Boolean(), server_default='false'))
    op.add_column('users', sa.Column('companion_character_id', sa.Integer(), sa.ForeignKey('companion_characters.id')))
    op.add_column('users', sa.Column('selected_path', sa.String(50)))
    op.add_column('users', sa.Column('selected_character_id', sa.Integer(), sa.ForeignKey('islamic_characters.id')))
    op.add_column('users', sa.Column('achievements', postgresql.JSONB, server_default='[]'))
    op.add_column('users', sa.Column('badges', postgresql.JSONB, server_default='[]'))

    # Create learning paths table
    op.create_table(
        'learning_paths',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('arabic_name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('cover_image', sa.String(500)),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('sort_order', sa.Integer(), default=0),
        sa.PrimaryKeyConstraint('id')
    )

    # Create lessons table
    op.create_table(
        'lessons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('path_id', sa.Integer(), sa.ForeignKey('learning_paths.id'), nullable=False),
        sa.Column('character_id', sa.Integer(), sa.ForeignKey('islamic_characters.id')),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('arabic_title', sa.String(200)),
        sa.Column('description', sa.Text()),
        sa.Column('content', postgresql.JSONB, nullable=False),
        sa.Column('duration', sa.Integer(), comment='Duration in minutes'),
        sa.Column('has_quiz', sa.Boolean(), server_default='false'),
        sa.Column('sort_order', sa.Integer(), default=0),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id')
    )

    # Create user progress table
    op.create_table(
        'user_lesson_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('lesson_id', sa.Integer(), sa.ForeignKey('lessons.id'), nullable=False, index=True),
        sa.Column('is_completed', sa.Boolean(), server_default='false'),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
        sa.Column('score', sa.Float()),
        sa.Column('time_spent', sa.Integer(), comment='Time spent in seconds'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'lesson_id', name='_user_lesson_uc')
    )

    # Create indexes
    op.create_index('idx_learning_paths_sort_order', 'learning_paths', ['sort_order'])
    op.create_index('idx_lessons_path_id', 'lessons', ['path_id'])
    op.create_index('idx_lessons_character_id', 'lessons', ['character_id'])
    op.create_index('idx_lessons_sort_order', 'lessons', ['sort_order'])
    op.create_index('idx_user_lesson_progress_user_lesson', 'user_lesson_progress', ['user_id', 'lesson_id'])

def downgrade():
    # Drop indexes
    op.drop_index('idx_user_lesson_progress_user_lesson', table_name='user_lesson_progress')
    op.drop_index('idx_lessons_sort_order', table_name='lessons')
    op.drop_index('idx_lessons_character_id', table_name='lessons')
    op.drop_index('idx_lessons_path_id', table_name='lessons')
    op.drop_index('idx_learning_paths_sort_order', table_name='learning_paths')

    # Drop tables
    op.drop_table('user_lesson_progress')
    op.drop_table('lessons')
    op.drop_table('learning_paths')

    # Drop columns from users table
    op.drop_constraint('users_companion_character_id_fkey', 'users', type_='foreignkey')
    op.drop_constraint('users_selected_character_id_fkey', 'users', type_='foreignkey')
    op.drop_column('users', 'badges')
    op.drop_column('users', 'achievements')
    op.drop_column('users', 'selected_character_id')
    op.drop_column('users', 'selected_path')
    op.drop_column('users', 'companion_character_id')
    op.drop_column('users', 'is_guest')

    # Drop companion characters table
    op.drop_table('companion_characters')
