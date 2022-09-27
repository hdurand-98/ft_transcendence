import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { FriendshipsController } from './friendships.controller';
import { FriendshipsService } from './friendships.service';
import { Friendships } from './frienship.entity';

@Module({
  controllers: [FriendshipsController],
	providers: [FriendshipsService],
	exports: [FriendshipsService],
  imports : [TypeOrmModule.forFeature([Friendships, User]), UserModule]
})
export class FriendshipsModule {}
