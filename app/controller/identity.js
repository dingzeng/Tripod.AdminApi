'use strict';

const BaseController = require('./base');
const uuidv1 = require('uuid/v1');

class IdentityController extends BaseController {
  async login() {
    const rules = {
      username: { type: 'string' },
      password: { type: 'string' }
    }
    this.ctx.validate(rules);
    const model = this.ctx.request.body;
    const user = await this.service.system.getUserByUsername(model.username);
    
    if (!user || model.password != user.password) {
      this.failed("用户名或密码错误");
    } else {
      const menus = await this.service.system.getUserMenus(user.id)
      const permissions = await this.service.system.getUserPermissions(user.id)

      const token = uuidv1();
      const userinfo = {
        menus: menus,
        permissions: permissions,
        name: user.Name,
        avatar: '',
        introduction: ''
      }
      await this.app.redis.set(token, JSON.stringify(userinfo));
      this.success({
        token: token
      }, "登录成功");
    }
  }

  async userinfo(){
    const token = this.ctx.request.query.token;
    const cache = await this.app.redis.get(token);
    var userinfo = null;
    if(cache){
      userinfo = JSON.parse(cache)
    }
    
    this.success(userinfo)
  }

  async logout() {
    const rules = {
      token: { type: 'string' }
    }
    this.ctx.validate(rules);
    const model = this.ctx.request.body;

    await this.app.redis.del(model.token);
    this.success();
  }
}

module.exports = IdentityController;
