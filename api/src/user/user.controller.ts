import { Body, Controller, Get, HttpException, HttpStatus, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { diskStorage } from 'multer';
import { resolve } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { joinChannelDto } from '../dtos/joinChannel.dto';
import { ModifyUserDto } from '../dtos/user.dto';
import { uuidDto } from '../dtos/uuid.dto';
import { v4 as uuidv4 } from 'uuid';
import { User } from './user.entity';
import { UserService } from './user.service';


/** https://stackoverflow.com/questions/54958244/how-to-use-query-parameters-in-nest-js?answertab=trending#tab-top PARMAS AND TOUTES  */
@ApiTags('User')
@Controller('user')
export class UserController {
	constructor(private userService: UserService) { }

	/**
	 *
	 * Returns an array of all users in database
	 * @returns an array of users
	 */

	@ApiOperation({ summary: "Get all users" })
	@Get('/')
	@UseGuards(JwtAuthGuard)
	async getUsers(): Promise<User[]> {
		return await this.userService.getUsers();
	}

	@Get('me')
	@ApiOperation({ summary: "Get information about current user with cookie" })
	@ApiResponse({ status: 200, description: "User is returned normally", type: User })
	@ApiResponse({ status: 403, description: "User is not logged in" })
	@ApiCookieAuth()
	@UseGuards(JwtAuthGuard)
	async getMe(@Req() req: Request): Promise<User> {
		return await this.userService.getUserByRequest(req);
	}

	/**
	 *
	 * Get info about user identified by uuid (also works when providing
	 * nickname)
	 * @param uuid the id or nickname
	 */

	@Get(':uuid')
	@ApiOperation({ summary: "Get all info about a user identified by :uuid" })
	@ApiResponse({ status: 200, description: "User is returned normally" })
	@ApiResponse({ status: 404, description: "User is not found" })
	async getUser(@Param() uuid: uuidDto): Promise<User> {
		return await this.userService.getUserByIdentifier(uuid.uuid);
	}


	/**
	 *
	 * Join channel from user.
	 *
	 * @param req the request containing user id
	 * @param joinRequest the joinChannelDto containing the channel name
	 */

	@Post('joinChannel')
	@UseGuards(JwtAuthGuard)
	@ApiCookieAuth()
	@ApiOperation({ summary: "Join a channel" })
	@ApiResponse({ status: 200, description: "User joined normally" })
	@ApiResponse({ status: 404, description: "User is not found/channel not created" })
	public async joinChannel(@Req() req: Request, @Body() joinRequest: joinChannelDto) {
		const channelname = joinRequest.chanName;
		const user: User = await this.userService.getUserByRequest(req);
		return this.userService.joinChannel(user, channelname);
	}

	/**
	 * Update profile of the connected user.
	 * @param req
	 * @param mail
	 * @returns
	 */
	@Patch('userSettings')
	@ApiOperation({ summary: "Update user settings on connected account" })
	@ApiResponse({ status: 200, description: "Profile updated" })
	@ApiResponse({ status: 403, description: "You're not logged in" })
	@UseGuards(JwtAuthGuard)
	@ApiCookieAuth()
	public async updateUser(@Req() req: Request, @Body() changes: ModifyUserDto): Promise<User> {
		const user: User = await this.userService.getUserByRequest(req);
		return this.userService.updateUser(user, changes);
	}

	@Post('leaveChannel')
	@ApiOperation({ summary: "leave a channel" })
	@UseGuards(JwtAuthGuard)
	@ApiCookieAuth()
	public async leaveChannel(@Req() req: Request, @Body() chanName: joinChannelDto) //: Promise<User>
	{
		const user: User = await this.userService.getUserByRequest(req);
		return await this.userService.leaveChannel(user, chanName.chanName);
	}

	@Post('blockUser')
	@ApiOperation({ summary: "Block a user" })
	@UseGuards(JwtAuthGuard)
	@ApiCookieAuth()
	public async blockUser(@Req() req: Request, @Body() toBeBlocked: { username : string}) //: Promise<User>
	{
		const user: User = await this.userService.getUserByRequest(req);
		const toBlock: User = await this.userService.getUserByIdentifier(toBeBlocked.username);
		return await this.userService.block(user, toBlock);
	}

	@Post('avatar')
	@UseGuards(JwtAuthGuard)
	@ApiCookieAuth()
	@ApiOperation({ summary: "Upload a new user avatar" })
	@ApiResponse({ status: 201, description: "Avatar uploaded and updated " })
	@ApiResponse({ status: 404, description: "User not found" })
	@ApiResponse({ status: 413, description: "File is too large" })
	@ApiResponse({ status: 415, description: "File uploaded is not an image" })
	@UseInterceptors(FileInterceptor('file', {
		limits: {
			fileSize: 8000000, // 1MB in Bytes
		},
		storage: diskStorage({
			destination: (req, file, cb) => cb(null, resolve('/', 'api', 'public')),
			filename: (req, file, cb) => cb(null, `${uuidv4().replace(/-/g, '')}.${(file.mimetype.split('/')[1])}`)
		}),
		fileFilter: (req, file, cb) => {
			if (file.mimetype.split('/')[0] !== "image")
				return cb(new HttpException("Only upload image", HttpStatus.UNSUPPORTED_MEDIA_TYPE), false);
			return cb(null, true);
		}
	}))
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	public async uploadAvatar(@Req() req: Request, @UploadedFile() file: Express.Multer.File) : Promise<User> {
		const user: User = await this.userService.getUserByRequest(req);

		if (file)
		{
			if (!user)
				throw new HttpException("User not found", HttpStatus.NOT_FOUND);
			user.avatar_url = "/public/" + file.filename;
			await user.save();
		}

		return user;
	}


}
