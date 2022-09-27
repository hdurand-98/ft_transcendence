import { IsNotEmpty } from "class-validator";

export class getPrivateMessageDto
{
	@IsNotEmpty()
	target : string;
}
