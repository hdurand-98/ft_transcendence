import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { ModifyChannelDto } from '../dtos/modifyChannel.dto';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { Repository } from 'typeorm';
import { validate as isValidUUID } from 'uuid';
import { Channel } from './channel.entity';

@Injectable()
export class ChannelService {

	constructor(@InjectRepository(Channel) private channelsRepo: Repository<Channel>,
	@Inject(forwardRef(() => UserService)) private readonly userService: UserService)
	{ }

	/**
	 * @brief Returns true if an user is in the specified channel, false if not.
	 * @param chan
	 * @param user
	 * @returns
	 */
	public async isInChan(chan: Channel, user: User) : Promise<boolean>
	{
		const foundChan : Channel = await this.channelsRepo.findOne({
			where : { name : chan.name, users : { id : user.id } }
		})
		if (foundChan != null)
			return true;
		return false;
	}

	/**
	 * @brief Create channel
	 * @param name the name of the channel
	 * @param req the request containing user id
	 * @returns
	 */
	public async createChannel(name: string, user: User, password: string = null, privacy : boolean = false)
	{
		const chan: Channel = new Channel();
		name = name.toUpperCase();
		chan.name = name;
		chan.owner = user;
		chan.admins = [];
		chan.muted = [];
		chan.banned = [];
		chan.admins = [...chan.admins, user];
		chan.private = privacy;
		if (password)
		{
			chan.password_protected = true;
			chan.password = await bcrypt.hash(password, 10);
		}
		await this.channelsRepo.save(chan)
		await this.userService.joinChannel(user, name, password);

	}

	/**
	 * @brief Set a new admin for a channel. Only admins can name another admin.
	 * @param user the user performing the request
	 * @param channel the channel concerned by changes
	 * @param toBeAdmin the user to be named
	 */
	public async setNewAdmin(user: User, channel : Channel, toBeAdmin: User)
	{
		if (!await this.isInChan(channel, toBeAdmin))
			throw new HttpException("User " + toBeAdmin.name + " is not in channel", HttpStatus.FORBIDDEN);
		if (!channel.adminsId.includes(user.id))
			throw new HttpException("You must be admin to name another admin.", HttpStatus.FORBIDDEN);
		channel.admins = [...channel.admins, toBeAdmin];
		channel.adminsId = [...channel.adminsId, toBeAdmin.id]
		await this.channelsRepo.save(channel);
	}

	/**
	 * @brief Returns all users of all existing channels
	 * @returns
	 */
	public async getUsersOfChannels() : Promise<Channel[]>
	{
		return await this.channelsRepo.createQueryBuilder('Channel')
			.orderBy("Channel.name")
			.leftJoinAndSelect("Channel.users", "Users")
			.leftJoinAndSelect("Channel.banned", "b")
			.leftJoinAndSelect("Channel.owner", "o")
			.getMany();
	}

	/**
	 * @brief Returns all users of all existing channels
	 * @returns
	 */
	public async getChannelsForUser(user : User) : Promise<Channel[]>
	{
		return await this.channelsRepo.createQueryBuilder('channel')
			.orderBy("channel.name")
			.leftJoinAndSelect("channel.users", "Users")
			.leftJoinAndSelect("channel.banned", "b")
			.leftJoinAndSelect("channel.owner", "o")
			.leftJoinAndSelect("channel.admins", "a")
			.where('channel.private = false')
			.orWhere("Users.id = :id", { id: user.id })
			.getMany();
	}

	/**
	 * @brief Find a channel by its name or its id
	 * @param channelIdentifier (id or name)
	 * @returns Channel object corresponding
	 */
	public async getChannelByIdentifier(channelIdentifier : string) : Promise<Channel>
	{
		const chan : Channel = await this.channelsRepo.findOne({ where: { name: channelIdentifier }, relations: ['messages', 'banned', 'admins', 'muted'] });
		if (!chan && isValidUUID(channelIdentifier))
			await this.channelsRepo.findOne({ where: { id: channelIdentifier }, relations: ['messages', 'banned', 'admins', 'muted'] })
		if (!chan)
			throw new HttpException('Channel ' + channelIdentifier + ' not found (id or name)', HttpStatus.NOT_FOUND);
		return chan;
	}

	/**
	 * @brief get the hashed form of the password for a particular user
	 * @param channelId (id or name)
	 * @returns
	 */
	async	getChannelPasswordHash(channelId: string): Promise<string> {
		const chan: Channel = await this.channelsRepo.createQueryBuilder('Channel')
			.select(["Channel.password"])
			.where({ "id": channelId })
			.getOne();
		return chan.password;
	}

	/**
	 * @description 🔐🔐🔐 OWNER ONLY FEATURE 🔐🔐🔐
 	 * @brief updateChannelSettings -- can only be performed by owner.
	 * @param user User requesting changes
 	 * @param changes changes to be performed - chanName or ownership
 	 * @returns Repository modified
 	 */
	public async updateChannelSettings(user: User, changes: ModifyChannelDto) : Promise<Channel>
	{
		const chan: Channel = await this.getChannelByIdentifier(changes.chanName);
		if (chan.ownerId != user.id)
			throw new HttpException("You must be owner to change chan settings.", HttpStatus.FORBIDDEN);
		if (changes.password)
		{
			chan.password_protected = true;
			chan.password = await bcrypt.hash(changes.password, 10);
		}
		else
		{
			chan.password_protected = false;
		}
		return await this.channelsRepo.save(chan);
	}


	/**
	 * @description ADMIN FEATURE 🔐🔐🔐
 	 * @brief deleteChannel -- performed by administrator
	 * @param user User requesting changes
 	 * @param changes changes to be performed - chanName or ownership
 	 */
	public async deleteChannel(user: User, channel: Channel): Promise<void>
	{
		if (!channel.adminsId.includes(user.id) || channel.ownerId != user.id)
			throw new HttpException("You must be admin to delete chan.", HttpStatus.FORBIDDEN);
		await this.channelsRepo
    		.createQueryBuilder()
    		.delete()
    		.from(Channel)
    		.where("name = :channame", { channame: channel.name })
			.execute();
	}


	/**
	 * @description ADMIN FEATURE 🔐🔐🔐
	 * @brief delete an user from channel
 	 * @param user the user trying to perform the request
 	 * @param toDelete the user to deleetee
 	 * @returns
 	 */
	public async deleteUserFromChannel(user: User, channel : Channel, toDelete: User): Promise<void>
	{
		if (!channel.adminsId.includes(user.id))
			throw new HttpException("You must be admin to delete an user from chan.", HttpStatus.FORBIDDEN);
		if (!await this.isInChan(channel, user))
			throw new HttpException("User " + toDelete.name + " is not in channel", HttpStatus.FORBIDDEN);

		await this.channelsRepo.createQueryBuilder()
			.relation(Channel, "users")
			.of({ id: toDelete.id })
			.remove({ id: channel.id });
	}

	/**
	 * @description ADMIN FEATURE 🔐🔐🔐
	 * @brief unban an user from a channel
	 * @param channel the channel to unban from
	 * @param toUnBan the user to unban
	 * @returns
	 */
	public async unban(chanName: string, toUnBan: User): Promise<void>
	{
		const channel: Channel = await this.getChannelByIdentifier(chanName);
		channel.banned = channel.banned.filter((banned) => {
			return banned.id !== toUnBan.id
		})
		await channel.save();
	}

	/**
	 * @description ADMIN FEATURE 🔐🔐🔐
	 * @brief unmute an user from a channel
	 * @param channel the channel to unban from
	 * @param toUnMute the user to unmute
	 */
	public async unmute(chanName: string, toUnMute: User): Promise<void>
	{
		const channel: Channel = await this.getChannelByIdentifier(chanName);
		channel.muted = channel.muted.filter((muted) => {
			return muted.id !== toUnMute.id
		})
		await channel.save();
	}

	/**
	 * @description ADMIN FEATURE 🔐🔐🔐
	 * @brief ban user for 30 sec.
	 * @param user the user performing the request
	 * @param channel the channel to ban the user from
	 * @param toBan the user to ban
	 */
	public async temporaryBanUser(user: User, channel: Channel, toBan: User): Promise<void>
	{
		if (!channel.adminsId.includes(user.id))
			throw new HttpException("You must be admin to ban an user from chan.", HttpStatus.FORBIDDEN);
		if (channel.bannedId.includes(toBan.id))
			throw new HttpException("This user is already banned.", HttpStatus.FORBIDDEN);
		/** Step one : Deleting user from channel */
		await this.deleteUserFromChannel(user, channel, toBan);
		/** Step two : add it to ban list  */
		channel.banned = [...channel.banned, toBan];
		await channel.save();
		/** Step three : set timeout to remove from ban list */
		setTimeout(() => {
			this.unban(channel.name, toBan)
			.catch(() => { })
		}, 30000);
	}


	/**
	 * @description ADMIN FEATURE 🔐🔐🔐
	 * @brief mute user for 30 sec.
	 * @param user the user performing the request
	 * @param channel the channel to mute the user from
	 * @param toMute the user to mute
	 */
	public async temporaryMuteUser(user: User, channel: Channel, toMute: User): Promise<void>
	{
		if (!await this.isInChan(channel, toMute))
			throw new HttpException("User " + toMute.name + " is not in channel", HttpStatus.FORBIDDEN);
		if (!channel.adminsId.includes(user.id))
			throw new HttpException("You must be admin to mute an user from chan.", HttpStatus.FORBIDDEN);
		channel.muted = [...channel.muted, toMute];
		await channel.save();
		setTimeout(() => {
			this.unmute(channel.name, toMute)
				.catch(() => {})
		}, 30000);
	}
}
