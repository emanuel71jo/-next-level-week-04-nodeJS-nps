import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import { UserRepository } from "../repositories/UserRepository";
import * as yup from "yup";
import { AppError } from "../errors/AppError";

class UserController {
  async create(request: Request, response: Response) {
    const { name, email } = request.body;

    const schema = yup.object().shape({
      name: yup.string().required("O nome é obrigatório"),
      email: yup
        .string()
        .email("O email não está no formato correto")
        .required("O email é obrigatório"),
    });

    // if (!(await schema.isValid(request.body)))
    //   return response.status(400).json({ error: "Validation Failed" });

    try {
      await schema.validate(request.body, { abortEarly: false });
    } catch (error) {
      throw new AppError(error);
    }

    const userRepository = getCustomRepository(UserRepository);

    const userAlreadyExists = await userRepository.findOne({ email });

    if (userAlreadyExists) throw new AppError("User already exists");

    const user = userRepository.create({
      name,
      email,
    });

    await userRepository.save(user);

    return response.status(201).json(user);
  }
}

export { UserController };
