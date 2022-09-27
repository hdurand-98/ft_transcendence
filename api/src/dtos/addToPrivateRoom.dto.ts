import { IsNotEmpty } from "class-validator";
import { User } from "../user/user.entity";

export class addToPrivateRoomDto {

	@IsNotEmpty()
	readonly user: User;

	@IsNotEmpty()
	readonly chanName: string;

}
