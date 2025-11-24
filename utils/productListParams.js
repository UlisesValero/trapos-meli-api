export function parseProductListParams(req) {
  const page = Number.parseInt(req.query.page ?? "1", 10) || 1;
  const pageSize = Number.parseInt(req.query.pageSize ?? "20", 10) || 20;
  const search = (req.query.q ?? "").trim();
  const status = (req.query.status ?? "all").trim();

  return { page, pageSize, search, status };
}

export function buildProductListQuery({ search, status }) {
  const query = {};

  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [
      { title: regex },
      { item_id: regex },
      { sku: regex },
    ];
  }

  if (status !== "all") {
    query.status = status;
  }

  return query;
}
