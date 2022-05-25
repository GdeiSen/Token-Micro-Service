const jwt = require("jsonwebtoken");
const config = require("../../config.json")
class TokenService {
    async generateTokens(payload) {
        const accesToken = jwt.sign(payload, config.JWT_ACCES_SECRET, { expiresIn: '30m' });
        const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, { expiresIn: '30d' });
        return {
            accesToken,
            refreshToken
        }
    }

    validateAccessToken(token) {
        try {
            const userData = jwt.verify(token, config.JWT_ACCES_SECRET);
            return userData;
        } catch (e) {
            return null;
        }
    }

    validateRefreshToken(token) {
        try {
            const userData = jwt.verify(token, config.JWT_REFRESH_SECRET);
            return userData;
        } catch (e) {
            return null;
        }
    }

    async saveToken(userId, refreshToken) {
        const tokenData = await global.agent.connectionManager.get({
            name: 'findToken',
            where: { userId: userId },
            dispatchTo: 'data_queue'
        })
        if (tokenData) {
            await global.agent.connectionManager.post({
                name: 'updateToken',
                where: { id: tokenData.id },
                setValues: { refreshToken: refreshToken },
                dispatchTo: 'data_queue'
            })
            return;
        }
        global.agent.connectionManager.post({
            name: 'createToken',
            token: { UserId: userId, refreshToken: refreshToken },
            dispatchTo: 'data_queue'
        })
    }

    async removeToken(refreshToken) {
        const tokenData = await global.agent.connectionManager.get({
            name: 'deleteToken',
            where: { refreshToken: refreshToken },
            dispatchTo: 'data_queue'
        })
        return tokenData;
    }
}
exports.TokenService = TokenService;