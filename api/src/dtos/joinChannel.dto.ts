import { IsNotEmpty } from "class-validator";

export class joinChannelDto {

	@IsNotEmpty()
	readonly chanName: string;

}
