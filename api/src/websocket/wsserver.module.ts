import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChannelModule } from '../channel/channel.module';
import { FriendshipsModule } from '../friendships/friendships.module';
import { MessageModule } from '../message/message.module';
import { UserModule } from '../user/user.module';
import { ChatService } from './chat.service';
import { ConnectService } from './connect.service';
import { WSServer } from './wsserver.gateway';
import { GameModule } from '../game/game.module';
import { AchievementsModule } from '../achievements/achievements.module';
import { GameRelayService } from '../game/game.logic';


@Module({

	imports: [UserModule, MessageModule, JwtModule, ChannelModule, FriendshipsModule,  forwardRef(() => GameModule), AchievementsModule],
	exports: [ChatService, WSServer],
	providers: [WSServer, ChatService, ConnectService, GameRelayService]
})

export class WSServerModule {}


