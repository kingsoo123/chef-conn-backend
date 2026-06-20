DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM users
    WHERE email = 'chef.tunde@chefconnect.demo'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO users (id, email, first_name, last_name, phone, role)
  VALUES
    ('11111111-1111-4111-8111-111111111101', 'chef.tunde@chefconnect.demo', 'Tunde', 'Adeyemi', '+2348000000001', 'chef'),
    ('11111111-1111-4111-8111-111111111102', 'chef.amaka@chefconnect.demo', 'Amaka', 'Okonkwo', '+2348000000002', 'chef'),
    ('11111111-1111-4111-8111-111111111103', 'chef.segun@chefconnect.demo', 'Segun', 'Balogun', '+2348000000003', 'chef'),
    ('11111111-1111-4111-8111-111111111104', 'chef.nneka@chefconnect.demo', 'Nneka', 'Eze', '+2348000000004', 'chef'),
    ('11111111-1111-4111-8111-111111111105', 'chef.obi@chefconnect.demo', 'Obi', 'Nwosu', '+2348000000005', 'chef'),
    ('11111111-1111-4111-8111-111111111106', 'chef.folake@chefconnect.demo', 'Folake', 'Adebayo', '+2348000000006', 'chef'),
    ('11111111-1111-4111-8111-111111111107', 'chef.emeka@chefconnect.demo', 'Emeka', 'Okafor', '+2348000000007', 'chef'),
    ('11111111-1111-4111-8111-111111111108', 'chef.zainab@chefconnect.demo', 'Zainab', 'Bello', '+2348000000008', 'chef')
  ON CONFLICT (email) DO NOTHING;

  INSERT INTO chef_profiles (
    user_id, display_name, slug, bio, experience, specialties, services, areas,
    status, price_per_day, rating, review_count, is_available, image_url
  )
  VALUES
    (
      '11111111-1111-4111-8111-111111111101',
      'Chef Tunde',
      'demo-chef-tunde',
      'Reimagining Nigerian heritage through contemporary techniques. Available for home dining, private events, and weekly meal prep.',
      '12+',
      ARRAY['Afro-Fusion & Traditional'],
      ARRAY['home-dining', 'meal-prep'],
      ARRAY['Ikoyi', 'Victoria Island', 'Lekki'],
      'approved', 45000, 4.9, 128, true,
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDrY9rfRi4O82wUquIwf8w80n0bskGFymamRUwtFmqXGbnCwK99lGKx8nuXrR_wZ-c8XcMqI0aja44CA-vmHcVW0hF574cPV2kK3Sa-5Xdcp2hATtrgpbtaX1PP8nd-ucj3Ax9C4D2ROW4x_fnvBUyjlMer4X4FZK3tDqqusp3O4YiSkqRCLRX4qAwafeRhlVgv_VozlAy5dOSyCS4uyKSg1E7RtjxoQE1noaAPirc6z26s85oFRThrj28ZtBPmKmaRgeRC7eyM_C1p'
    ),
    (
      '11111111-1111-4111-8111-111111111102',
      'Chef Amaka',
      'demo-chef-amaka',
      'Elegant interpretations of West African staples for a sophisticated palate. Ideal for intimate dinners and corporate events.',
      '8-12',
      ARRAY['Contemporary West African'],
      ARRAY['home-dining', 'private-events', 'catering'],
      ARRAY['Victoria Island', 'Ikoyi', 'Banana Island'],
      'approved', 62000, 5.0, 94, true,
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAvKe-i0EORm2dkUI_knPKakBthLncR3kdW1acuCXoY1IdoehhFYyxB8w38ZnD9s6gIr5SkzMIxdGkqf6qDOmMO-AqG4BZeyhrggmshm9PYo5Jg_bg0dTWhHr9OCQ_YDJcwl04Cn2MB7CS3UMz9jsmIno7slYaZQf9-Nv87Hd-RnrI9S52vXOfxkdZv0FkNGLqFG_8Hp-raFlrDepXeCYnMor-0KiWbpf1cTifn5M4lOAt_thWxYF6AphnTISd-czq7JmlCpKkb4YwF'
    ),
    (
      '11111111-1111-4111-8111-111111111103',
      'Chef Segun',
      'demo-chef-segun',
      'A culinary journey across the continent, curated for private tasting experiences and large-format owambe catering.',
      '12+',
      ARRAY['Gourmet Pan-African'],
      ARRAY['catering', 'private-events'],
      ARRAY['Lekki', 'Ajah', 'Victoria Island'],
      'approved', 78000, 4.8, 76, true,
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCYTi4KNxnby2iJTjYhWT1A3JodIgV8vZP98GDDsF8rPlx7Jdg6Bw--_wgLKcnwYHMIW0DPFtlIU6_jJw6CbMZcSTkqFLX5NqxqK4RwjmQ40z-3Tn9cInUlGl3RcaLHQ2s5kQHoES5Nnpo99LkLBNJxzXGH34SF7nUTE21nr4l4R9YU8u7hdCQUIE2HtPLQdmDfckyxAx_eKcPR-rFV8XuCuUq7bJDKCHc2mYO0be3UV9MTgWRBUMBYq-AJVyEp5-lDaR3MiuGM7zk8'
    ),
    (
      '11111111-1111-4111-8111-111111111104',
      'Chef Nneka',
      'demo-chef-nneka',
      'Award-winning pastry chef specialising in fusion desserts and bespoke celebration cakes for private dining experiences.',
      '8-12',
      ARRAY['Pastry & Desserts'],
      ARRAY['home-dining', 'private-events'],
      ARRAY['Ikoyi', 'Lekki', 'Yaba'],
      'approved', 38000, 4.9, 62, true,
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBM6sglcb2PICcQhp6dgnzcy2jTj7AURnSTtgK2UnRFzKg3IwIaXduHpUZ7slAkNYe9XVxs8p2K6xwuTAlBrqFLi3XcqzFz0Fl-jxYndCbFZ1MAfDTv0lrG44HaJFT6Sqpa7NYvBdr4h8UW2y0g9btsaRhB-weJQywBp7PgOqRkA7YFusU_8y3D0hN7ObvMCQfZzm-qV3PB7VPBaQ5-cAOcNdE8QAV2t3vqEZy3dZtA-2XLfeLNEksagGKJ9P5m6AgikizButS6DfzW'
    ),
    (
      '11111111-1111-4111-8111-111111111105',
      'Chef Obi',
      'demo-chef-obi',
      'Classically trained in European cuisine with a Nigerian soul. Perfect for executive dinners and weekly meal preparation.',
      '8-12',
      ARRAY['Continental'],
      ARRAY['home-dining', 'meal-prep', 'private-events'],
      ARRAY['Victoria Island', 'Ikoyi', 'Ikeja'],
      'approved', 52000, 4.7, 51, false,
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDEBtza_oGyo99KmeDp9q8M28N5fAA5IUgV_GkHkSLnLTrmIktvQVAw7bNKU4sZgyHQRKB3rMXxbsy0zPBzWq2E2bP1ELBVRexXXt2hkkA3NvBWDAStuQzp1S4A5Yi0OGAXIE4ZGvEHrK-d3iaCD_e64ptMa3sLJovGmtQyXTMXOtKVq1HhIJN7ofcCBSom_ftpyRpZVgZFFmSqSD2BN2MTjI33op5npHn-8aipLj0qt03_lU2EzcCi5cLmbe-U2AffbM3X1sWVcIiy'
    ),
    (
      '11111111-1111-4111-8111-111111111106',
      'Chef Folake',
      'demo-chef-folake',
      'Healthy Afro-fusion meal prep and family-style home dining. Locally sourced ingredients with traditional Lagos flavours.',
      '4-7',
      ARRAY['Afro-Fusion & Traditional'],
      ARRAY['meal-prep', 'home-dining'],
      ARRAY['Lekki', 'Ajah', 'Surulere'],
      'approved', 42000, 4.8, 88, true,
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAbUlGMqgjy7tK_mMQ75GHzsP5FUF52rcHNEP-2xF4irdGYLszScyot0qEM0s4oHc8GpTH0n84TtLqgEPEtTD6O-XS9xoJ9NpbDc2t_7U0M6WMYWhgUiVoJUQl9xQmjhjO3Yb0IOVx1A6Fq-RWUGsbS8jWg9V_UiFUa_bWCVIGbhkCMvilqTIlXx7yvJetuZOV1ovha86NknQWiSytsw4sXw_S1bo83Im_XBzgDx-m6vdDrtxlYn-Ezd7NBRMSrUNg-W7ezSoTQi_i1'
    ),
    (
      '11111111-1111-4111-8111-111111111107',
      'Chef Emeka',
      'demo-chef-emeka',
      'Premium seafood tasting menus and coastal Nigerian cuisine for exclusive private events and high-end home dining.',
      '12+',
      ARRAY['Seafood Specialist'],
      ARRAY['home-dining', 'private-events', 'catering'],
      ARRAY['Banana Island', 'Ikoyi', 'Victoria Island'],
      'approved', 95000, 4.9, 45, true,
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDJAL-ckHQFCE_I-b-GbT2qIhQLJNR4gORrG-yeG2LChuqLc8l4YGAjbhjz_IdbjNb4ABfDfyx0bXEUWNJBEbNcuB6pIwHcI5x_0luGVz-8W2gNI7uEB4TxuLco2SQ2NOxMPtbaKq9SdHP5clfJoS4buT07TX8muRJ80iJkYMblWpo-s-tVMuM2FeskHQdtVL0IA0KwlC08hViz_dY5HOVaYSo5RYJ8DUzeMMSAFSRVx8BNOM4vEGuYbkZfgwPcco8hYiRAjOFQEge3'
    ),
    (
      '11111111-1111-4111-8111-111111111108',
      'Chef Zainab',
      'demo-chef-zainab',
      'Pan-African catering for mid-size events and weekly meal prep packages. Bold flavours with efficient, reliable service.',
      '4-7',
      ARRAY['Gourmet Pan-African'],
      ARRAY['catering', 'meal-prep'],
      ARRAY['Yaba', 'Surulere', 'Ikeja'],
      'approved', 48000, 4.6, 39, true,
      'https://lh3.googleusercontent.com/aida-public/AB6AXuByUPDnq4F5QcHf__FtTnQC3Hwd1ZQCru0XQExiQZwD4HVl6vTr_pk2QX0i6f47e9aabixd2PG37_UlTa2Su1e590_zhYyJnP-fJDCq2x8972U3GJLZFTcI1BeAXcAZjQy7kKllPPBzVnRcDdQQOY-nf08hGmLZXYdzPx5kRty0D8GGLXO_phGBZn5BqjTXFkn_OkhI3KWtc6O3vt6iMrbiQ1yy_fOwLQHcaprLtK_YS5YCFDO-Je7ZGpeMWu76T3s-haFO-QG8GiGA'
    )
  ON CONFLICT (user_id) DO NOTHING;
END $$;
