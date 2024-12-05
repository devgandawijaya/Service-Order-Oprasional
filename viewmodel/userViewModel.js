const User = require("../models/user");

class UserViewModel {

  async getClientSecrets() {
    const result = await User.getClientSecretm();
    return result;
  }

  async getTokenExperedDate(req) {
    const result = await User.getTokenExperedDate(req);
    return result;
  }

  async getTokenExperedDateToken(req) {
    const result = await User.getTokenExperedDateToken(req);
    return result;
  }


  async storeTokenSession(req) {
    const result = await User.storeTokenSession(req);
    return result;
  }

  async storeTokenSessionBca(req) {
    const result = await User.storeTokenSessionbca(req);
    return result;
  }

  async storeOrder(req) {
    const result = await User.storeOrder(req);
    return result;
  }

  async getOrderToServer() {
    const result = await User.getOrderServer();
    return result;
  }


  async getValidateHeader(req){
    const result = await User.getValidateHeader(req);
    return result;
  }

  async storejofinish(req){
    const result = await User.storejofinish(req);
    return result;
  }

  async getJoAll(){
    try {
        const result = await User.getAllJoToBca();
        return result;
    } catch (error) {
      logger.log(`User.getAllJoToBca() : ${error}`);
        throw error;
    }
  }


  async storeHistoryTransaction(requestid, jsonresponsemessage){
    try {
      const result = await User.storeHistoryTransaction(requestid, jsonresponsemessage);
      return result;
      } catch (error) {
      throw error;
      }
  }

  async putTransaction(requestid, status){
    try {
      const result = await User.updateJoStatus(requestid, status);
      return result;
      } catch (error) {
      throw error;
      }
  }

  async storeMasterVendor(req) {
    const result = await User.storeMasterVendor(req);
    return result;
  }

  async updateMasterVendor(req) {
    const result = await User.updateMasterVendor(req);
    return result;
  }

  async postNonCluster(req) {
    const result = await User.postNonCluster(req);
    return result;
  }

  async validateNonCluster(req) {
    const result = await User.valNonCluster(req);
    return result;
  }

  
}

module.exports = new UserViewModel();
