import Deliveries from '@/models/Deliveries.model';
import Products from '@/models/Products.model';

const find = async (req) => {
  // some vars
  let query = {};
  let limit = req.body.limit ? (req.body.limit > 100 ? 100 : parseInt(req.body.limit)) : 100;
  let skip = req.body.page ? ((Math.max(0, parseInt(req.body.page)) - 1) * limit) : 0;
  let sort = { _id: 1 }

  // if date provided, filter by date
  if (req.body.when) {
    query['when'] = {
      '$gte': req.body.when
    }
  };

  let totalResults = await Deliveries.find(query).countDocuments();

  if (totalResults < 1) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find any delivery`
      }
    }
  }

  let deliveries = await Deliveries.find(query).skip(skip).sort(sort).limit(limit);

  return {
    totalResults: totalResults,
    deliveries
  }
}

const create = async (req) => {
  try {
    await Deliveries.create(req.body);
  } catch (e) {
    throw {
      code: 400,
      data: {
        message: `An error has occurred trying to create the delivery:
          ${JSON.stringify(e, null, 2)}`
      }
    }
  }
}

const search = async (req) => {
  try {
    // Building Query
    let query = {};
    // (1) Parameter "limit"
    let limit = req.body.limit ? (req.body.limit > 200 ? 200 : parseInt(req.body.limit)) : 100;
    // (2) Parameter "page"
    let skip = req.body.page ? ((Math.max(0, parseInt(req.body.page)) - 1) * limit) : 0;
    // Sort by date - ASC
    let sort = { when: 1 };
  
    // (3 y 4) Param "dateFrom" and "dateTo" (Filter By When)
    query['when'] = {
        '$gte': `${req.body.dateFrom}`,
        '$lte': `${req.body.dateTo}`,
    };
  
    // Search for products with a weight greater than or equal to the parameter "weight" 
    const prod = await Products.find({weight:{
      '$gte': req.body.weight
    }});
  
    // Array of filtered product Ids
    const arrIdsProd = prod.map((prod) => { 
      return prod._id;
    }); 

    // (5) Parameter "weight" 
    query['products'] = {
      $in: arrIdsProd  
    }  
  
    // ===== Exec Main Query ======
    const deliveriesCount = await Deliveries.find(query).countDocuments();
    const deliveries = await Deliveries.find(query).skip(skip).sort(sort).limit(limit)
    .populate('products');
   
    return {
      totalResults: deliveriesCount,
      deliveries,
    } 
  } catch (e) {
    throw {
      code: 400,
      data: {
        message: `An error has occurred trying to search the deliveries:
          ${JSON.stringify(e, null, 2)}`
      }
    }
  }
}

const findOne = async (req) => {
  let delivery = await Deliveries.findOne({_id: req.body.id});
  if (!delivery) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find a delivery with the sent ID`
      }
    }
  }
  return delivery;
}

export default {
  find,
  search,
  create,
  findOne
}
