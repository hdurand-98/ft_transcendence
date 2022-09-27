import { IsNotEmpty } from "class-validator";
import { User } from "../user/user.entity";

export class banUserDto {

	@IsNotEmpty()
	channel: string;

	@IsNotEmpty()
	toBan: User;
}
