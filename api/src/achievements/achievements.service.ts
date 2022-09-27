import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Repository } from 'typeorm';
import { Achievements, Achievements_types } from './achievements.entity';

@Injectable()
export class AchievementsService {


	constructor (@InjectRepository(Achievements) private successRepo : Repository<Achievements>) {}

	public async createAchievements(user: User, type : Achievements_types)
	{
		await this.successRepo.save({
			user: user,
			achievement_list: type
		});
		return this.successRepo.find( { relations: ['user'] });
	}

	public async getAchievements(user: User)
	{
		return await this.successRepo.find({
			select:["achievement_list"],
			where: {
				user: { id: user.id },
			},
			});
	}

	public async hasAchievements(type: Achievements_types, user: User)
    {
        const exists = await this.successRepo.findOne({
            where: {
                user: { id: user.id },
                achievement_list: type
            },
            });
          if (!exists)
              return false;
          return true;
    }
}
