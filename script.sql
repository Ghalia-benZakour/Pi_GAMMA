DROP TABLE IF EXISTS fact_sinistres CASCADE;
DROP TABLE IF EXISTS dim_contrat CASCADE;
DROP TABLE IF EXISTS dim_assure CASCADE;
DROP TABLE IF EXISTS dim_vehicule CASCADE;
DROP TABLE IF EXISTS dim_region CASCADE;
DROP TABLE IF EXISTS dim_date CASCADE;

CREATE TABLE dim_date (
    date_id SERIAL PRIMARY KEY,
    full_date DATE NOT NULL,
    year INT,
    month INT,
    month_name VARCHAR(20),
    quarter INT,
    semester INT,
    season VARCHAR(20)
);

CREATE TABLE dim_region (
    region_id SERIAL PRIMARY KEY,
    region_name VARCHAR(100),
    area VARCHAR(100),
    zone VARCHAR(100)
);

CREATE TABLE dim_assure (
    assure_id SERIAL PRIMARY KEY,
    original_assure_id VARCHAR(100),
    age_driver FLOAT,
    driving_experience FLOAT,
    gender VARCHAR(50),
    marital_status VARCHAR(50),
    risk_profile VARCHAR(50)
);

CREATE TABLE dim_vehicule (
    vehicule_id SERIAL PRIMARY KEY,
    vehicle_age FLOAT,
    year_matriculation INT,
    vehicle_power VARCHAR(50),
    vehicle_type VARCHAR(100),
    fuel_type VARCHAR(50),
    brand VARCHAR(100)
);

CREATE TABLE dim_contrat (
    contrat_id SERIAL PRIMARY KEY,
    original_contract_id VARCHAR(100),
    date_start_contract DATE,
    date_last_renewal DATE,
    date_next_renewal DATE,
    date_lapse DATE,
    contract_age_years FLOAT,
    payment_type VARCHAR(100),
    distribution_channel VARCHAR(100),
    contract_status VARCHAR(50)
);

CREATE TABLE fact_sinistres (
    fact_id SERIAL PRIMARY KEY,

    date_id INT REFERENCES dim_date(date_id),
    region_id INT REFERENCES dim_region(region_id),
    assure_id INT REFERENCES dim_assure(assure_id),
    vehicule_id INT REFERENCES dim_vehicule(vehicule_id),
    contrat_id INT REFERENCES dim_contrat(contrat_id),

    exposure FLOAT,
    premium FLOAT,
    nb_sinistres FLOAT,
    cout_sinistres FLOAT,

    frequence FLOAT,
    severite FLOAT,
    prime_pure FLOAT,
    loss_ratio FLOAT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fact_date ON fact_sinistres(date_id);
CREATE INDEX idx_fact_region ON fact_sinistres(region_id);
CREATE INDEX idx_fact_assure ON fact_sinistres(assure_id);
CREATE INDEX idx_fact_vehicule ON fact_sinistres(vehicule_id);
CREATE INDEX idx_fact_contrat ON fact_sinistres(contrat_id);