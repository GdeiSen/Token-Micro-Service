const bcrypt = require('bcrypt');
const uuid = require('uuid');
const { UserDto } = require('../dtos/userDtos');
const { MailService } = require('./mailService');
const { TokenService } = require('./tokenService');
const mailService = new MailService()
const tokenService = new TokenService()
const config = require("../../config.json")
class UserService {
    async registration(email, password) {
        const candidate = await global.agent.connectionManager.get({
            name: 'findUser',
            where: { email: email },
            dispatchTo: 'data_queue'
        })
        if (candidate) throw new Error('User Email Already Exists')
        const hasPassword = await bcrypt.hash(password, 3)
        const activationLink = uuid.v4();
        await mailService.sendActivationMail(email, `${config.API_URL}/activate/${activationLink}`);
        const user = await global.agent.connectionManager.get({
            name: 'createUser',
            user: { email: email, password: hasPassword, activationLink: activationLink },
            dispatchTo: 'data_queue'
        })
        const userDto = new UserDto(user)
        const tokens = await tokenService.generateTokens({ ...userDto })
        tokenService.saveToken(userDto.id, await tokens.refreshToken)
        return { ...tokens, user: userDto }
    }

    async activate(activationLink) {
        const user = await global.agent.connectionManager.get({
            name: 'findUser',
            user: { activationLink: activationLink },
            dispatchTo: 'data_queue'
        })
        if (!user) {
            throw new Error('Not Valid Activation Link')
        }
        user.isActivated = true;
        await global.agent.connectionManager.get({
            name: 'updateUser',
            setValues: { isActivated: true },
            where: { id: user.id },
            dispatchTo: 'data_queue'
        })
    }

    async login(email, password) {
        const user = await global.agent.connectionManager.get({
            name: 'findUser',
            where: { email: email },
            dispatchTo: 'data_queue'
        })
        if (!user) throw new Error('No User With Such Email!')
        const isPassEquals = await bcrypt.compare(password, user.password);
        if (!isPassEquals) {
            throw new Error('Incorrect Password!');
        }
        const userDto = new UserDto(user);
        const tokens = await tokenService.generateTokens({ ...userDto });
        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return { ...tokens, user: userDto }
    }

    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken);
        return token;
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new Error('No Refresh Token!');
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await global.agent.connectionManager.get({
            name: 'findToken',
            where: { refreshToken: refreshToken },
            dispatchTo: 'data_queue'
        })
        if (!userData || !tokenFromDb) {
            throw new Error('User Validation Error!');
        }
        const user = await global.agent.connectionManager.get({
            name: 'findUser',
            where: { id: userData.id },
            dispatchTo: 'data_queue'
        })
        const userDto = new UserDto(user);
        const tokens = await tokenService.generateTokens({ ...userDto });

        await tokenService.saveToken(userDto.id, tokens.refreshToken);
        return { ...tokens, user: userDto }
    }
}
exports.UserService = UserService;