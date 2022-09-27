import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { Brackets, Repository } from 'typeorm';
import { Friendships } from './frienship.entity';

@Injectable()
export class FriendshipsService {

	constructor(@InjectRepository(Friendships) private friendRepo: Repository<Friendships>,
				@InjectRepository(User) private userRepo : Repository<User>,
				private userservice : UserService) { }

	public async sendFriendRequest(sender: User, target: User)
	{
		const friendship : Friendships = await this.friendRepo
		.createQueryBuilder('friend')
		.where(new Brackets(qb => {
			qb.where("friend.sender = :sender", { sender: sender.id })
				.orWhere("friend.sender = :sender2", { sender2: target.id })
		}))
		.andWhere(new Brackets(qb => {
			qb.where("friend.target = :dst", { dst: sender.id })
				.orWhere("friend.target = :dst1", { dst1: target.id })
		}))
			.getOne();
		if (friendship) /** La relation existe deja */
			return;

		return await this.friendRepo.save({
			sender: sender.id,
			target: target.id,
			status: "pending"
		});
	}

	public async acceptFriendRequest(user1: User, user2: User) : Promise<Friendships>
	{
		const friendship : Friendships = await this.friendRepo
			.createQueryBuilder('friend')
			.where(new Brackets(qb => {
				qb.where("friend.sender = :sender", { sender: user1.id })
					.orWhere("friend.sender = :sender2", { sender2: user2.id })
			}))
			.andWhere(new Brackets(qb => {
				qb.where("friend.target = :dst", { dst: user1.id })
					.orWhere("friend.target = :dst1", { dst1: user2.id })
			}))
			.getOne();
		friendship.status = "accepted";
		await this.friendRepo.save(friendship);
		const first : User = await this.userservice.getUserByIdentifier(user1.id);
		const second : User = await this.userservice.getUserByIdentifier(user2.id);

		first.friends = [...first.friends, user2];
		second.friends = [...second.friends, user1];

		await first.save();
		await second.save();

		return ;
	}

	public async getFriendsRequests(user : User) : Promise<Friendships[]>
	{
		return await this.friendRepo
		.createQueryBuilder('friend')
		.leftJoinAndMapOne("friend.sender", User, 'users', 'users.id = friend.sender')
		.leftJoinAndMapOne("friend.target", User, 'usert', 'usert.id = friend.target')
		.where("friend.target = :target", { target: user.id })
		.andWhere("friend.status = :ok", { ok: "pending" })
		.select(['friend.sender'])
		.addSelect([
			'friend.target',
			'friend.status',
			'users.name',
			'users.id',
			'users.avatar_url',
			'usert.name',
			'usert.id',
			'usert.avatar_url'
		  ])
		.getMany();

	}

	public async getFriendsofUsers(user: User) : Promise<User>
	{
		const res: User = await this.userRepo.createQueryBuilder('user')
			.leftJoinAndSelect('user.friends', "u")
			.where('user.id = :id', { id: user.id })
			.getOne();
		return res;
	}

	async removeFriend(user1 : User, user2 : User)
	{
		await this.userRepo
			.createQueryBuilder("user")
			.relation(User, "friends")
			.of(user1)
			.remove(user2);

		await this.userRepo
			.createQueryBuilder("user")
			.relation(User, "friends")
			.of(user2)
			.remove(user1);

		return await this.friendRepo.createQueryBuilder()
			.delete()
			.from(Friendships)
			.where(new Brackets(qb => {
				qb.where("sender = :sender", { sender: user1.id })
					.orWhere("sender = :sender2", { sender2: user2.id })
			}))
			.andWhere(new Brackets(qb => {
				qb.where("target = :dst", { dst: user1.id })
					.orWhere("target = :dst1", { dst1: user2.id })
			}))
			.execute();

	}
}
