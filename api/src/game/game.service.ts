import { ConsoleLogger, HttpCode, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateMatchDto, endMatchDto } from '../dtos/match.dto';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { Brackets, Repository } from 'typeorm';
import { MatchHistory } from './game.entity';
import { Socket, Server } from 'socket.io'
import { Achievements_types } from '../achievements/achievements.entity';
import { AchievementsService } from '../achievements/achievements.service';
import { compareSync } from 'bcrypt';
import { identity } from 'rxjs';
import { stringify } from 'querystring';


@Injectable()
export class GameService {

	constructor (
		@InjectRepository(MatchHistory) private MatchRepo: Repository<MatchHistory>,
		@InjectRepository(User) private UserRepo: Repository<User>,
		private userService: UserService,
		private achievementsService: AchievementsService,
	) { }

	/**
	 *
	 *
	 * @returns All the matches with details (joining users tab)
	 */
	async getCompleteMatchHistory(): Promise<MatchHistory[]> {
		return this.MatchRepo.createQueryBuilder("Match")
			.leftJoinAndMapOne("Match.user1", User, 'users', 'users.id = Match.user1')
			.leftJoinAndMapOne("Match.user2", User, 'usert', 'usert.id = Match.user2')
			.select(['Match.id', 'Match.startTime', 'Match.stopTime', 'Match.scoreUser1', 'Match.scoreUser2', 'Match.finished'])
			.addSelect([
				"users.name",
				"users.avatar_url",
				"users.wonMatches",
				"usert.name",
				"usert.avatar_url",
				"usert.wonMatches"
			])
			.getMany();
	}
	/**
	 *
	 * @param user1
	 * @param user2
	 * @returns
	 */
   	async createMatch(user1: User, user2: User) {//Promise<MatchHistory> {
		const newMatch: MatchHistory = await this.MatchRepo.save(
			{
				user1: user1.id,
				user2: user2.id
			});
		await this.MatchRepo.save(newMatch);
		return newMatch; /* Comme ca le front peut stock l'id ? */
	}

	/**
	 * At the end of match, we can now add :
	 * - stop Time
	 * - ScoreUser1
	 * - ScoreUser2
	 * @param match
	 * @returns
	 */
	async endMatch(match: endMatchDto): Promise<any> // en vrai c'est MatchHistory[]
	{
		const endedMatch: MatchHistory = await this.findMatchById(match.id);
		if (!endedMatch)
			throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
		if (endedMatch.finished == true)
			return ({ "msg": "Match is already finished man!", "match": endedMatch });
		endedMatch.scoreUser1 = match.scoreUser1;
		endedMatch.scoreUser2 = match.scoreUser2;
		endedMatch.stopTime = new Date();
		endedMatch.finished = true;
		const winner: User = match.scoreUser1 > match.scoreUser2 ? await this.userService.getUserByIdentifier(endedMatch.user1) : await this.userService.getUserByIdentifier(endedMatch.user2);
		winner.wonMatches += 1;
		const loser: User = match.scoreUser1 < match.scoreUser2 ? await this.userService.getUserByIdentifier(endedMatch.user1) : await this.userService.getUserByIdentifier(endedMatch.user2);
		loser.lostMatches += 1;
		await this.UserRepo.save(winner);
		await this.UserRepo.save(loser);
		await this.MatchRepo.save(endedMatch);
		await this.checkForAchievements(winner);
		await this.checkForAchievements(loser);
		return await this.getCompleteMatchHistory();
	}


	async ladder(): Promise<User[]>
	{
		return await this.UserRepo.createQueryBuilder('user')
			.orderBy('user.wonMatches', 'DESC')
			.getMany();
	}

	async findMatchById(matchId: string) {
		const match: MatchHistory = await this.MatchRepo.findOne({
			where: { id: matchId }
		});
		return match;
	}

	async findMatchByUser(user: User) {
		const match: MatchHistory[] = await this.MatchRepo.find({
			where: [ { user1: user.id },
					 { user2: user.id } ]
		});
		return match;
	}

	async getAllMatchesofUser(user: User) {
		return this.MatchRepo.createQueryBuilder("Match")
		.leftJoinAndMapOne("Match.user1", User, 'users', 'users.id = Match.user1')
		.leftJoinAndMapOne("Match.user2", User, 'usert', 'usert.id = Match.user2')
		.where({'user1' : user.id})
		.orWhere({ "user2": user.id})
		.select(['Match.id', 'Match.startTime', 'Match.stopTime', 'Match.scoreUser1', 'Match.scoreUser2', 'Match.finished'])
		.addSelect([
			"users.name",
			"users.avatar_url",
			"users.wonMatches",
			"usert.name",
			"usert.avatar_url",
			"usert.wonMatches"
		])
		.getMany();
	}

	async listGameOngoing()
	{
		const list: MatchHistory[]  = await this.MatchRepo.find({
			where :{
				finished: false,
			},
		})
		return list;
	}

	async isInGame(user : User)
	{
		let isIn: MatchHistory  = await this.MatchRepo.findOne({
			where :  {
				finished: false,
				user1: user.id
			},
		})
		if (!isIn)
		{
			isIn  = await this.MatchRepo.findOne({
			where :{
				finished: false,
				user2: user.id
			},
		})
		}
		if (isIn != null)
			return true;
		return false;
	}

	async checkForAchievements(user: User)
	{
		if (user.wonMatches == user.lostMatches)
		{
			this.addAchievement(user, Achievements_types.HALFHALF);
		}
		if (user.wonMatches == 1)
		{
			this.addAchievement(user, Achievements_types.FIRST);
		}
		if (user.wonMatches == 3 && user.lostMatches == 0)
		{
			this.addAchievement(user, Achievements_types.WINNER);
		}
		if (user.lostMatches == 3 && user.wonMatches == 0)
		{
			this.addAchievement(user, Achievements_types.LOSER);
		}
	}

	async addAchievement(user: User , achievement: Achievements_types)
	{
		if (await this.achievementsService.hasAchievements(achievement, user) == false)
		{
			await this.achievementsService.createAchievements(user, achievement);
		}
	}
}
