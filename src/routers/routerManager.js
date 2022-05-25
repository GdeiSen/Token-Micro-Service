const { TokenController } = require("../controllers/tokenController");
const { UserController } = require("../controllers/userController");

exports.RouterManager = class RouterManager {
    constructor(agent) {
        this.agent = agent;
        this.connectionManager = agent.connectionManager
        this.userController = new UserController(agent);
        this.tokenController = new TokenController()
        this.RequestEmitter = agent.connectionManager.RequestEmitter
    }
    createRouter() {
        this.connectionManager.addRoute('registration', this.userController.registration);
        this.connectionManager.addRoute('activate', this.userController.activate);
        this.connectionManager.addRoute('login', this.userController.login);
        this.connectionManager.addRoute('logout', this.userController.logout);
        this.connectionManager.addRoute('refresh', this.userController.refreshToken);
        this.connectionManager.addRoute('validateAccessToken', this.tokenController.validateAccessToken);
        this.connectionManager.addRoute('validateRefreshToken', this.tokenController.validateRefreshToken);
    }
}