import { IsNotEmpty } from "class-validator";
import { User } from "../user/user.entity";

export class muteUserDto {

	@IsNotEmpty()
	channel: string;

	@IsNotEmpty()
	toMute: User;
}
