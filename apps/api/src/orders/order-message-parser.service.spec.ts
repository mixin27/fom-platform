import { OrderMessageParserService } from './order-message-parser.service';

describe('OrderMessageParserService', () => {
  const service = new OrderMessageParserService();

  it('parses labeled Messenger text into a ready order draft', () => {
    const result = service.parseMessage(
      [
        'Name: Daw Khin Myat',
        'Phone: 09 7812 3456',
        'Address: No. 45, Bo Gyoke St, Sanchaung Tsp, Yangon',
        'Product: Silk Longyi Set (Green, Size M)',
        'Qty: 2',
        'Price: 18,000 MMK',
        'Deli: 3,000',
      ].join('\n'),
    );

    expect(result.suggested_order).toEqual(
      expect.objectContaining({
        customer: expect.objectContaining({
          name: 'Daw Khin Myat',
          phone: '09 7812 3456',
          township: 'Sanchaung',
          address: 'No. 45, Bo Gyoke St, Sanchaung Tsp, Yangon',
        }),
        delivery_fee: 3000,
        subtotal: 36000,
        total_price: 39000,
        source: 'messenger',
        status: 'new',
      }),
    );
    expect(result.suggested_order.items).toEqual([
      expect.objectContaining({
        product_name: 'Silk Longyi Set (Green, Size M)',
        qty: 2,
        unit_price: 18000,
        line_total: 36000,
      }),
    ]);
    expect(result.parse_meta.is_ready_to_create).toBe(true);
    expect(result.parse_meta.warnings).toEqual([]);
  });

  it('supports Myanmar digits and payment keywords', () => {
    const result = service.parseMessage(
      [
        'နာမည်: မသဇင်',
        'ဖုန်း: ၀၉ ၇၈၁၂ ၃၄၅၆',
        'လိပ်စာ: အမှတ် ၄၅, ဗိုလ်ချုပ်လမ်း, Sanchaung Tsp, Yangon',
        'ပစ္စည်း: Longyi Set x၂ ၁၈,၀၀၀',
        'ပို့ခ: ၃,၀၀၀',
        'ငွေလွှဲပြီး',
      ].join('\n'),
    );

    expect(result.suggested_order.customer).toEqual(
      expect.objectContaining({
        name: 'မသဇင်',
        phone: '09 7812 3456',
        township: 'Sanchaung',
      }),
    );
    expect(result.suggested_order.items).toEqual([
      expect.objectContaining({
        product_name: 'Longyi Set',
        qty: 2,
        unit_price: 18000,
      }),
    ]);
    expect(result.suggested_order.delivery_fee).toBe(3000);
    expect(result.suggested_order.status).toBe('confirmed');
    expect(result.parse_meta.is_ready_to_create).toBe(true);
  });

  it('parses multiple unlabeled item lines into items array', () => {
    const result = service.parseMessage(
      [
        'Daw Khin Myat',
        '09 7812 3456',
        'No. 45, Bo Gyoke St, Sanchaung Tsp, Yangon',
        'Silk Longyi Set x2 18000',
        'Handbag x1 25000',
        'Deli 3000',
      ].join('\n'),
    );

    expect(result.suggested_order.items).toEqual([
      expect.objectContaining({
        product_name: 'Silk Longyi Set',
        qty: 2,
        unit_price: 18000,
        line_total: 36000,
      }),
      expect.objectContaining({
        product_name: 'Handbag',
        qty: 1,
        unit_price: 25000,
        line_total: 25000,
      }),
    ]);
    expect(result.suggested_order.subtotal).toBe(61000);
    expect(result.suggested_order.total_price).toBe(64000);
    expect(result.parse_meta.is_ready_to_create).toBe(true);
  });

  it('parses repeated labeled product blocks as multiple items', () => {
    const result = service.parseMessage(
      [
        'Name: Daw Khin Myat',
        'Phone: 09 7812 3456',
        'Product: Silk Longyi Set',
        'Color: Green',
        'Size: M',
        'Qty: 2',
        'Price: 18,000',
        'Product: Handbag',
        'Color: Black',
        'Qty: 1',
        'Price: 25,000',
        'Deli: 3,000',
      ].join('\n'),
    );

    expect(result.suggested_order.items).toEqual([
      expect.objectContaining({
        product_name: 'Silk Longyi Set (Green, Size M)',
        qty: 2,
        unit_price: 18000,
        line_total: 36000,
      }),
      expect.objectContaining({
        product_name: 'Handbag (Black)',
        qty: 1,
        unit_price: 25000,
        line_total: 25000,
      }),
    ]);
    expect(result.suggested_order.subtotal).toBe(61000);
    expect(result.suggested_order.total_price).toBe(64000);
    expect(result.parse_meta.is_ready_to_create).toBe(true);
  });

  it('parses comma-separated mixed items on one line', () => {
    const result = service.parseMessage(
      [
        'Name: Daw Khin Myat',
        'Phone: 09 7812 3456',
        'Product: Silk Longyi Set x2 18000, Handbag x1 25000, Shirt x3 12000',
        'Deli: 3,000',
      ].join('\n'),
    );

    expect(result.suggested_order.items).toEqual([
      expect.objectContaining({
        product_name: 'Silk Longyi Set',
        qty: 2,
        unit_price: 18000,
        line_total: 36000,
      }),
      expect.objectContaining({
        product_name: 'Handbag',
        qty: 1,
        unit_price: 25000,
        line_total: 25000,
      }),
      expect.objectContaining({
        product_name: 'Shirt',
        qty: 3,
        unit_price: 12000,
        line_total: 36000,
      }),
    ]);
    expect(result.suggested_order.subtotal).toBe(97000);
    expect(result.suggested_order.total_price).toBe(100000);
    expect(result.parse_meta.is_ready_to_create).toBe(true);
  });
});
