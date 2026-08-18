import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const isProduction = config.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres' as const,
          ...(databaseUrl
            ? { url: databaseUrl }
            : {
                host: config.get<string>('DATABASE_HOST', 'localhost'),
                port: config.get<number>('DATABASE_PORT', 5432),
                database: config.get<string>('DATABASE_NAME', 'medlink'),
                username: config.get<string>('DATABASE_USER', 'medlink_user'),
                password: config.get<string>('DATABASE_PASSWORD', 'medlink_pass'),
              }),
          entities: [join(__dirname, 'entities', '**', '*.entity.{ts,js}')],
          migrations: [join(__dirname, 'migrations', '**', '*.{ts,js}')],
          migrationsRun: false,
          synchronize: !isProduction && config.get<string>('DB_SYNCHRONIZE') === 'true',
          logging: config.get<string>('NODE_ENV') === 'development',
          ssl: isProduction ? { rejectUnauthorized: true } : false,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
