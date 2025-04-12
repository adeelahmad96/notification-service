import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateNotificationsTable1710000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'recipient_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'recipient_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'subject',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'html_content',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'retry_count',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          {
            name: 'idx_notifications_recipient',
            columnNames: ['recipient_id'],
          },
          {
            name: 'idx_notifications_status',
            columnNames: ['status'],
          },
          {
            name: 'idx_notifications_type',
            columnNames: ['type'],
          },
          {
            name: 'idx_notifications_created_at',
            columnNames: ['created_at'],
          },
        ],
        checks: [
          {
            name: 'chk_notification_status',
            expression: "status IN ('PENDING', 'SENT', 'FAILED', 'FAILED_PERMANENT')",
          },
        ],
      }),
      true
    );

    // Create a trigger to automatically update updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = now();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_notifications_updated_at
          BEFORE UPDATE ON notifications
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications');
    await queryRunner.query('DROP FUNCTION IF EXISTS update_updated_at_column');
    await queryRunner.dropTable('notifications');
  }
} 