import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateNotificationTemplatesTable1710000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notification_templates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'event_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'hiring_stage',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'subject_template',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'content_template',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'html_template',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'required_variables',
            type: 'jsonb',
            isNullable: false,
            comment: 'List of variables required for template rendering',
          },
          {
            name: 'channels',
            type: 'varchar[]',
            isNullable: false,
            comment: 'Array of supported notification channels',
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
            comment: 'Template version number',
          },
          {
            name: 'active',
            type: 'boolean',
            default: true,
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
        ],
        indices: [
          {
            name: 'idx_templates_event_stage',
            columnNames: ['event_type', 'hiring_stage'],
            isUnique: true,
            where: 'active = true',
          },
          {
            name: 'idx_templates_name',
            columnNames: ['name'],
            isUnique: true,
          },
        ],
      }),
      true
    );

    // Create trigger for updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_notification_templates_updated_at
          BEFORE UPDATE ON notification_templates
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates');
    await queryRunner.dropTable('notification_templates');
  }
} 