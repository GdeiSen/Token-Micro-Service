const { TokenService } = require('../services/tokenService');
const { UserService } = require('../services/userService');
const userService = new UserService()
const tokenService = new TokenService()
exports.UserController = class UserController {
    async registration(request, responce) {
        try {
            const userData = await userService.registration(request.email, request.password);
            responce.send(userData);
        } catch (error) {
            responce.error(error.toString());
        }
    }

    async activate(request, responce) {
        try {
            await userService.activate(request.activationLink);
            responce.send(true);
        } catch (error) {
            responce.error(error.toString());
        }
    }

    async login(request, responce) {
        try {
            const userData = await userService.login(request.email, request.password);
            responce.send(userData);
        } catch (error) {
            responce.error(error.toString());
        }
    }

    async logout(request, responce) {
        try {
            const token = await tokenService.removeToken(request.refreshToken);
            responce.send(token);
        } catch (error) {
            responce.error(error.toString());
        }
    }

    async refreshToken(request, responce) {
        try {
            const tokens = await userService.refresh(request.refreshToken);
            responce.send(tokens);
        } catch (error) {
            responce.error(error.toString());
        }
    }

}
