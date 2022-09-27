import { IsNotEmpty } from "class-validator";

export class CreateMatchDto {

	@IsNotEmpty()
	readonly user1: string;

	@IsNotEmpty()
	readonly user2: string;
}

export class endMatchDto {

	@IsNotEmpty()
	readonly id : string;

	@IsNotEmpty()
	readonly scoreUser1: number;

	@IsNotEmpty()
	readonly scoreUser2: number;
}
