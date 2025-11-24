-- users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- properties (imoveis)
CREATE TABLE properties (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  address TEXT,
  address_number TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  type VARCHAR(50),
  construction_type VARCHAR(50),
  area NUMERIC,
  estimated_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- quotes
CREATE TABLE quotes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  quotation_number TEXT,
  request JSONB,
  response JSONB,
  status VARCHAR(30) DEFAULT 'quoted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- policies
CREATE TABLE policies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  quote_id INTEGER REFERENCES quotes(id),
  policy_number TEXT UNIQUE,
  status VARCHAR(30) DEFAULT 'active',
  valid_from DATE,
  valid_to DATE,
  premium NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- claims (sinistros)
CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER REFERENCES policies(id) ON DELETE CASCADE,
  description TEXT,
  date_occurred DATE,
  estimated_value NUMERIC,
  status VARCHAR(30) DEFAULT 'registered',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- payments
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER REFERENCES policies(id),
  amount NUMERIC,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending',
  external_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- domains cache (dominios)
CREATE TABLE domains (
  id SERIAL PRIMARY KEY,
  code TEXT,
  domain_value JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- documents 
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  policy_id INTEGER REFERENCES policies(id) NULL,
  type TEXT,
  filename TEXT,
  storage_key TEXT,
  meta JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
