const { TokenService } = require('../services/tokenService');
const tokenService = new TokenService()
exports.TokenController = class TokenController {
    async validateAccessToken(request, responce) {
        try {
            const tokenData = await tokenService.validateAccessToken(request.accessToken);
            responce.send(tokenData);
        } catch (error) {
            responce.error(error.toString());
        }
    }

    async validateRefreshToken(request, responce) {
        try {
            const tokenData = await tokenService.validateRefreshToken(request.refreshToken);
            responce.send(tokenData);
        } catch (error) {
            responce.error(error.toString());
        }
    }

}
