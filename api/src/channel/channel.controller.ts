import { Body, Controller, Delete, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { Channel } from './channel.entity';
import { ChannelService } from './channel.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { deleteFromChannelDto } from '../dtos/deleteFromChannelDto.dto';
import { ModifyChannelDto } from '../dtos/modifyChannel.dto';
import { newChannelDto } from '../dtos/newChannel.dto';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

@ApiTags('Channel')
@Controller('channel')
export class ChannelController {

	constructor(private chanService: ChannelService, private userService: UserService) { }

	/**
	 * Get all users of all channels.
	 * @returns
	 */

	@Get()
	@ApiOperation({ summary: "Get all users of all channels" })
	public async getChans() : Promise<Channel[]>
	{
		return await this.chanService.getUsersOfChannels();
	}

	/**
	 * Create a new channel specifying channel name from a user.
	 * The requesting user will own the channel.
	 *
	 * @param req containing id user that will be
	 * @param query
	 * @returns
	 */

	@Post('new')
	@ApiOperation({ summary: "Create a new Channel" })
	@UseGuards(JwtAuthGuard)
	public async newChannel(@Req() req : Request, @Body() query : newChannelDto)
	{
		const chanName: string = query.chanName;
		const user: User = await this.userService.getUserByRequest(req);
		return await this.chanService.createChannel(chanName, user);
	}


	/**
	 * Create a new channel specifying channel name from a user.
	 * The requesting user will own the channel.
	 *
	 * @param req containing id user that will be
	 * @param query
	 * @returns
	 */
	@Patch('update')
	@ApiOperation({ summary: "Create a new Channel" })
	@UseGuards(JwtAuthGuard)
	// Ajouter Role Guards pour
	public async updateChannelSettings(@Req() req : Request, @Body() changes : ModifyChannelDto)
	{
		const user: User = await this.userService.getUserByRequest(req);
		return await this.chanService.updateChannelSettings(user, changes);
	}

	@Delete('delete')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: "Delete channel" })
	public async deleteChannel(@Req() req: Request, @Body() channelToDelete: newChannelDto)
	{
		const user: User = await this.userService.getUserByRequest(req);
		const channel: Channel = await this.chanService.getChannelByIdentifier(channelToDelete.chanName);
		return await this.chanService.deleteChannel(user, channel);
	}

	@Delete('deleteUser')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: "Delete user from channel" })
	public async deleteUserFromChannel(@Req() req: Request, @Body() deleteUser: deleteFromChannelDto)
	{
		const user: User = await this.userService.getUserByRequest(req);
		const channel: Channel = await this.chanService.getChannelByIdentifier(deleteUser.chanName);
		const toBan: User = await this.userService.getUserByIdentifier(deleteUser.userToDelete);
		return await this.chanService.deleteUserFromChannel(user, channel, toBan)
	}

	@Post('banUser')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: "Delete user from channel" })
	public async temporaryBanUser(@Req() req: Request, @Body() deleteUser : deleteFromChannelDto) // autoban pour le test
	{
		const user: User = await this.userService.getUserByRequest(req);
		const channel: Channel = await this.chanService.getChannelByIdentifier(deleteUser.chanName);
		const toBan: User = await this.userService.getUserByIdentifier(deleteUser.userToDelete);
		return await this.chanService.temporaryBanUser(user, channel, toBan)
	}
}
