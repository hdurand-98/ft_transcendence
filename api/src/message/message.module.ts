import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Channel } from '../channel/channel.entity';
import { ChannelModule } from '../channel/channel.module';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { channelMessage } from './channelMessage.entity';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { privateMessage } from './privateMessage.entity';

@Module({
	controllers: [MessageController],
	exports : [MessageService],
	providers: [MessageService],
	imports: [TypeOrmModule.forFeature([privateMessage, channelMessage, Channel, User]), forwardRef(() => ChannelModule) , forwardRef(() => UserModule)],
})
export class MessageModule {}
