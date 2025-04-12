import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateNotificationRulesTable1710000000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'notification_rules',
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
            name: 'recipient_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Type of recipient (CANDIDATE, HIRING_MANAGER, RECRUITER)',
          },
          {
            name: 'template_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'conditions',
            type: 'jsonb',
            isNullable: true,
            comment: 'JSON conditions that must be met to apply this rule',
          },
          {
            name: 'channels',
            type: 'varchar[]',
            isNullable: false,
            comment: 'Array of channels to use for this rule',
          },
          {
            name: 'priority',
            type: 'integer',
            default: 0,
            comment: 'Higher priority rules are evaluated first',
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
            name: 'idx_rules_event_stage_recipient',
            columnNames: ['event_type', 'hiring_stage', 'recipient_type'],
          },
          {
            name: 'idx_rules_priority',
            columnNames: ['priority'],
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      'notification_rules',
      new TableForeignKey({
        name: 'fk_rules_template',
        columnNames: ['template_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'notification_templates',
        onDelete: 'RESTRICT',
      }),
    );

    // Create trigger for updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_notification_rules_updated_at
          BEFORE UPDATE ON notification_rules
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TRIGGER IF EXISTS update_notification_rules_updated_at ON notification_rules');
    await queryRunner.dropForeignKey('notification_rules', 'fk_rules_template');
    await queryRunner.dropTable('notification_rules');
  }
} 