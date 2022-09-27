import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { AchievementsController } from './achievements.controller';
import { Achievements } from './achievements.entity';
import { AchievementsService } from './achievements.service';

@Module({
	imports: [TypeOrmModule.forFeature([Achievements]), UserModule],
	providers: [AchievementsService],
	controllers: [AchievementsController],
	exports: [AchievementsService]
})
export class AchievementsModule {}
