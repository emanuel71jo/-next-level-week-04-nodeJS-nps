import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import { SurveyRepository } from "../repositories/SurveyRepository";
import { SurveyUserRepository } from "../repositories/SurveyUserRepository";
import { UserRepository } from "../repositories/UserRepository";
import SendMailService from "../services/SendMailService";
import { resolve } from "path";
import { AppError } from "../errors/AppError";

class SendMailController {
  async execute(request: Request, response: Response) {
    const { email, survey_id } = request.body;

    const usersRepository = getCustomRepository(UserRepository);
    const surveysRepository = getCustomRepository(SurveyRepository);
    const surveysUsersRepository = getCustomRepository(SurveyUserRepository);

    const userAlreadyExists = await usersRepository.findOne({ email });

    if (!userAlreadyExists) throw new AppError("User does not exists");

    const surveyAlreadyExists = await surveysRepository.findOne({
      id: survey_id,
    });

    if (!surveyAlreadyExists) throw new AppError("Survey does not");

    const surveysUsersAlreadyExists = await surveysUsersRepository.findOne({
      where: { user_id: userAlreadyExists.id, value: null },
      relations: ["user", "survey"],
    });

    const variables = {
      name: userAlreadyExists.name,
      title: surveyAlreadyExists.title,
      description: surveyAlreadyExists.description,
      id: "",
      link: process.env.URL_MAIL,
    };
    const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");

    if (surveysUsersAlreadyExists) {
      variables.id = surveysUsersAlreadyExists.id;

      await SendMailService.execute(
        email,
        surveyAlreadyExists.title,
        variables,
        npsPath
      );

      return response.json(surveysUsersAlreadyExists);
    }

    const surveyUser = await surveysUsersRepository.create({
      user_id: userAlreadyExists.id,
      survey_id,
    });

    await surveysUsersRepository.save(surveyUser);

    variables.id = surveyUser.id;

    await SendMailService.execute(
      email,
      surveyAlreadyExists.title,
      variables,
      npsPath
    );

    return response.json(surveyUser);
  }
}

export { SendMailController };
