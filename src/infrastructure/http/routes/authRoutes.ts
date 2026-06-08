import { Router, type Request, type Response } from 'express';
import type { IUserRepository } from '../../../domain/IUserRepository';

export function authRoutes(userRepository: IUserRepository): Router {
  const router = Router();

  /**
   * POST /auth/login
   * Body: { email: string, password?: string }
   * Returns: { user, token }
   *
   * Authenticates by email only (no password hash implemented yet).
   * Token is a simple bearer token derived from the user ID.
   */
  router.post('/login', async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string };

    if (!email) {
      res.status(400).json({ error: 'E-mail obrigatório.' });
      return;
    }

    const user = await userRepository.findByEmail(email.trim().toLowerCase());

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const token = `klass-token-${user.id}`;

    res.status(200).json({ user, token });
  });

  return router;
}
