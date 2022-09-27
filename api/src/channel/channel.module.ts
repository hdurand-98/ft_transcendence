import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelController } from './channel.controller';
import { ChannelService } from '../channel/channel.service';
import { Channel } from './channel.entity';
import { UserModule } from '../user/user.module';


@Module({
	imports: [TypeOrmModule.forFeature([Channel]), forwardRef(() => UserModule)],
	providers: [ChannelService],
	controllers: [ChannelController],
	exports: [ChannelService]
})

export class ChannelModule {}
