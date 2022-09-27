import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelModule } from './channel/channel.module';
import { AuthModule } from './auth/auth.module';
import { GameModule } from './game/game.module';
import { FriendshipsModule } from './friendships/friendships.module';
import { WSServerModule } from './websocket/wsserver.module'
import { AchievementsModule } from './achievements/achievements.module';

@Module({

	imports: [
		ConfigModule.forRoot({
			envFilePath: '.env',
		}),
		UserModule,
		ChannelModule,
		WSServerModule,
		GameModule,
		AchievementsModule,
		TypeOrmModule.forRoot({
			type: 'postgres',
			host: 'db',
			port: 5432,
			username: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
			database: process.env.POSTGRES_DB,
			autoLoadEntities: true,
			synchronize: true,
			logging: false
		}),
		AuthModule,
		FriendshipsModule],
})

export class AppModule { }
