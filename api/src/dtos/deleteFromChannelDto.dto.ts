import { IsNotEmpty } from "class-validator";

export class deleteFromChannelDto {

	@IsNotEmpty()
	chanName: string;

	@IsNotEmpty()
	userToDelete: string;
}
