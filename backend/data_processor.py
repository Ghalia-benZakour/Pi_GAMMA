import pandas as pd
import numpy as np
from pathlib import Path
from config import DATA_PATH


class DataProcessor:
    def __init__(self):
        self.df = self._load()

    def _load(self) -> pd.DataFrame:
        path = Path(DATA_PATH)
        if not path.exists():
            return self._empty_df()
        try:
            df = pd.read_csv(path, sep=";", low_memory=False)
        except Exception:
            return self._empty_df()
        if df.empty:
            return self._empty_df()

        date_cols = [c for c in ["Date_start_contract","Date_last_renewal","Date_next_renewal",
                                  "Date_birth","Date_driving_licence","Date_lapse"] if c in df.columns]
        for c in date_cols:
            df[c] = pd.to_datetime(df[c], errors="coerce", dayfirst=True)

        obs = df.get("Date_last_renewal", df.get("Date_start_contract"))
        if obs is None:
            df["Observation_date"] = pd.Timestamp.today().normalize()
        else:
            df["Observation_date"] = obs

        df["Obs_year"]  = df["Observation_date"].dt.year
        df["Obs_month"] = df["Observation_date"].dt.month

        if "Date_birth" in df.columns:
            df["Age_driver"] = (df["Observation_date"] - df["Date_birth"]).dt.days / 365.25
            df.loc[(df["Age_driver"] < 16) | (df["Age_driver"] > 100), "Age_driver"] = np.nan

        if "Date_driving_licence" in df.columns:
            df["Driving_experience"] = (df["Observation_date"] - df["Date_driving_licence"]).dt.days / 365.25
            df.loc[(df["Driving_experience"] < 0) | (df["Driving_experience"] > 80), "Driving_experience"] = np.nan

        if "Year_matriculation" in df.columns:
            df["Vehicle_age"] = df["Obs_year"] - pd.to_numeric(df["Year_matriculation"], errors="coerce")
            df.loc[(df["Vehicle_age"] < 0) | (df["Vehicle_age"] > 50), "Vehicle_age"] = np.nan

        if "Exposure" not in df.columns:
            if "Date_next_renewal" in df.columns:
                expo = (df["Date_next_renewal"] - df["Observation_date"]).dt.days / 365.25
                df["Exposure"] = expo.clip(0.01, 1.0).fillna(1.0)
            else:
                df["Exposure"] = 1.0

        for col in ["N_claims_year", "Cost_claims_year"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).clip(lower=0)

        n = pd.to_numeric(df.get("N_claims_year", 0), errors="coerce").fillna(0)
        c = pd.to_numeric(df.get("Cost_claims_year", 0), errors="coerce").fillna(0)
        expo = pd.to_numeric(df.get("Exposure", 1), errors="coerce").fillna(1).clip(0.01, 1.0)

        df["freq_obs"] = n / expo
        df["sev_obs"]  = np.where(n > 0, c / n, np.nan)
        df["pp_obs"]   = c / expo
        df["Has_claim"] = (n > 0).astype(int)

        if "Premium" in df.columns:
            df["Premium"] = pd.to_numeric(df["Premium"], errors="coerce")

        return df

    def _empty_df(self):
        return pd.DataFrame([{"ID": 1, "Area": "unknown", "Premium": 0,
                               "N_claims_year": 0, "Cost_claims_year": 0, "Exposure": 1.0}])

    # ── Portfolio ────────────────────────────────────────────────────────────

    def get_portfolio_overview(self) -> dict:
        df = self.df
        n  = len(df)
        total_n    = float(pd.to_numeric(df.get("N_claims_year", 0), errors="coerce").fillna(0).sum())
        total_cost = float(pd.to_numeric(df.get("Cost_claims_year", 0), errors="coerce").fillna(0).sum())
        expo       = float(pd.to_numeric(df.get("Exposure", 1), errors="coerce").fillna(1).sum())
        premium    = pd.to_numeric(df.get("Premium", 0), errors="coerce").dropna()
        return {
            "nb_contrats":       int(n),
            "nb_variables":      int(df.shape[1]),
            "nb_sinistres":      int(total_n),
            "exposition_totale": round(expo, 2),
            "frequence":         round(total_n / max(expo, 1e-9), 4),
            "severite":          round(total_cost / max(total_n, 1), 2),
            "prime_pure":        round(total_cost / max(expo, 1e-9), 2),
            "cout_total":        round(total_cost, 2),
            "prime_moyenne":     round(float(premium.mean()), 2) if len(premium) else 0,
            "taux_sinistralite": round(total_n / max(n, 1) * 100, 2),
            "valeurs_manquantes": int(df.isna().sum().sum()),
            "doublons":          int(df.duplicated().sum()),
        }

    def get_sample(self, limit: int = 50) -> list:
        cols = [c for c in ["ID", "Area", "Premium", "N_claims_year", "Cost_claims_year",
                             "Obs_year", "Age_driver", "Driving_experience"] if c in self.df.columns]
        return self.df[cols].head(limit).fillna("").to_dict(orient="records")

    def get_columns(self) -> list:
        return self.df.columns.tolist()

    def get_eda_summary(self) -> dict:
        df = self.df
        premium  = pd.to_numeric(df.get("Premium", 0), errors="coerce").dropna()
        cost     = pd.to_numeric(df.get("Cost_claims_year", 0), errors="coerce")
        n_claims = pd.to_numeric(df.get("N_claims_year", 0), errors="coerce")
        cost_pos = cost[n_claims > 0]
        age      = pd.to_numeric(df.get("Age_driver", np.nan), errors="coerce").dropna()
        exp_driv = pd.to_numeric(df.get("Driving_experience", np.nan), errors="coerce").dropna()
        veh_age  = pd.to_numeric(df.get("Vehicle_age", np.nan), errors="coerce").dropna()

        def stat(s):
            if len(s) == 0:
                return {"min": 0, "max": 0, "moyenne": 0, "mediane": 0, "ecart_type": 0}
            return {
                "min":        round(float(s.min()), 2),
                "max":        round(float(s.max()), 2),
                "moyenne":    round(float(s.mean()), 2),
                "mediane":    round(float(s.median()), 2),
                "ecart_type": round(float(s.std()), 2),
            }

        return {
            "prime":          stat(premium),
            "cout_sinistre":  stat(cost_pos),
            "age_conducteur": stat(age),
            "experience":     stat(exp_driv),
            "age_vehicule":   stat(veh_age),
            "pct_sinistres":  round(float((n_claims > 0).mean() * 100), 2),
            "nb_observations":int(len(df)),
        }

    def get_frequency_by_variable(self, variable: str) -> list:
        if variable not in self.df.columns or "N_claims_year" not in self.df.columns:
            return []
        id_col = "ID" if "ID" in self.df.columns else self.df.columns[0]
        g = (self.df.groupby(variable, dropna=False)
             .agg(effectif=(id_col, "count"), sinistres=("N_claims_year", "sum"))
             .reset_index())
        g["frequence"] = (g["sinistres"] / g["effectif"]).round(4)
        g = g.rename(columns={variable: "segment"})
        g["segment"] = g["segment"].astype(str)
        return g[["segment", "effectif", "frequence"]].head(20).fillna("NA").to_dict(orient="records")

    def get_severity_by_variable(self, variable: str) -> list:
        if variable not in self.df.columns or "Cost_claims_year" not in self.df.columns:
            return []
        mask = pd.to_numeric(self.df.get("N_claims_year", 0), errors="coerce").fillna(0) > 0
        f = self.df[mask].copy()
        if f.empty:
            return []
        g = (f.groupby(variable, dropna=False)
             .agg(effectif_sinistres=("Cost_claims_year", "count"), severite=("Cost_claims_year", "mean"))
             .reset_index())
        g["severite"] = g["severite"].round(2)
        g = g.rename(columns={variable: "segment"})
        g["segment"] = g["segment"].astype(str)
        return g[["segment", "effectif_sinistres", "severite"]].head(20).fillna("NA").to_dict(orient="records")

    def get_temporal_evolution(self) -> list:
        df = self.df.copy()
        if "Obs_year" not in df.columns:
            return []
        for col in ["N_claims_year", "Cost_claims_year", "Premium", "Exposure"]:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
            else:
                df[col] = 0
        grp = (df.groupby(["Obs_year", "Obs_month"], dropna=True)
               .agg(n=("Obs_year", "count"),
                    total_claims=("N_claims_year", "sum"),
                    total_cost=("Cost_claims_year", "sum"),
                    total_expo=("Exposure", "sum"),
                    avg_premium=("Premium", "mean"))
               .reset_index())
        grp["frequence"] = (grp["total_claims"] / grp["total_expo"].clip(lower=1e-9)).round(4)
        grp["severite"]  = np.where(grp["total_claims"] > 0,
                                    grp["total_cost"] / grp["total_claims"], 0)
        grp["prime_pure"]= (grp["total_cost"] / grp["total_expo"].clip(lower=1e-9)).round(2)
        return grp.fillna(0).sort_values(["Obs_year", "Obs_month"]).to_dict(orient="records")

    def get_db_info(self) -> dict:
        return {
            "source":      str(DATA_PATH),
            "rows":        int(len(self.df)),
            "columns":     int(self.df.shape[1]),
            "column_names": self.df.columns.tolist(),
        }

    def get_distribution(self, column: str, bins: int = 20) -> list:
        if column not in self.df.columns:
            return []
        s = pd.to_numeric(self.df[column], errors="coerce").dropna()
        if len(s) == 0:
            return []
        counts, edges = np.histogram(s, bins=bins)
        return [{"bin_start": round(float(edges[i]), 2),
                 "bin_end":   round(float(edges[i+1]), 2),
                 "count":     int(counts[i])} for i in range(len(counts))]


processor = DataProcessor()
