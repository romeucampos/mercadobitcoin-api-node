const axios = require('axios');
const createHmac = require('crypto').createHmac;
const stringify = require('querystring').stringify;

const MercadoBitcoin = function (KEY, SECRET) {
  var KEY;
  var SECRET;

  const BASE_URL = 'https://www.mercadobitcoin.net';
  const API_PATH = '/api/';
  const TAPI_PATH = '/tapi/v3/';
  const ENDPOINT_API = BASE_URL + API_PATH;
  const ENDPOINT_TRADE_API = BASE_URL + TAPI_PATH;

  const call = async (method, symbol) => {
    const req = await axios.get(`${ENDPOINT_API}${symbol}/${method}/`);
    try {
      return req.data;
    } catch (error) {
        if (error.response) {
          if (error.response.data.message) throw error.response.data.message;
          throw error.response.data;
        }
        throw error
    };
  };

  const callPrivate = async (method, parameters) => {
    const now = Math.round(new Date().getTime() / 1000);
    let params = {};

    if (parameters) {
      params = parameters
    };

    params.tapi_method = method;
    params.tapi_nonce = now;
    const url_params = stringify(params);

    const signature = createHmac('sha512', SECRET)
      .update(TAPI_PATH + '?' + url_params)
      .digest('hex');

    try {
      const requests = await axios({
        method: 'post',
        url: ENDPOINT_TRADE_API,
        headers: {
          'TAPI-ID': KEY,
          'TAPI-MAC': signature
        },
        data: url_params,
      });
      return requests.data.response_data;
    } catch (error) {
      if (error.response) {
        if (error.response.data.message) throw error.response.data.message;
        throw error.response.data;
      }
      throw error
    }
  };

  return {
    call,
    callPrivate,
    ticker: (symbol) => {
      return call('ticker', symbol);
    },
    orderbook: (symbol) => {
      return call('orderbook', symbol);
    },
    trades: (symbol) => {
      return call('trades', symbol);
    },
    getAccountInfo: () => {
      return callPrivate('get_account_info', null);
    },
    getOrder: (coinPair, orderId) => {
      return callPrivate('get_order', { coin_pair: `BRL${coinPair}`, order_id: orderId });
    },
    placeBuyOrder: (coinPair, quantity, limitPrice) => {
      return callPrivate('place_buy_order', { coin_pair: `BRL${coinPair}`, quantity: quantity, limit_price: limitPrice })
    },
    placeSellOrder: (coinPair, quantity, limitPrice) => {
      return callPrivate('place_sell_order', { coin_pair: `BRL${coinPair}`, quantity: quantity, limit_price: limitPrice })
    },
    placeMarketBuyOrder: (coinPair, cost) => {
      return callPrivate('place_market_buy_order', { coin_pair: `BRL${coinPair}`, cost: cost })
    },
    placeMarketSellOrder: (coinPair, cost) => {
      return callPrivate('place_market_sell_order', { coin_pair: `BRL${coinPair}`, cost: cost })
    },
    cancelOrder: (coinPair, orderId) => {
      return callPrivate('cancel_order', { coin_pair: `BRL${coinPair}`, order_id: orderId });
    },
    listOrderbook: (coinPair, orderId) => {
      return callPrivate('list_orderbook', { coin_pair: `BRL${coinPair}` });
    },
  };
};

module.exports = MercadoBitcoin;
