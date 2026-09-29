"""Districts used by the synthetic demo catalogue.

Coordinates are approximate district-headquarters positions, good enough to
place a marker on a national map. They exist so the demo dataset is spatially
plausible; nothing here feeds the risk engine.
"""

from __future__ import annotations

from typing import NamedTuple


class District(NamedTuple):
    state: str
    district: str
    lat: float
    lon: float


DISTRICTS: tuple[District, ...] = (
    District("Maharashtra", "Nanded", 19.15, 77.33),
    District("Maharashtra", "Pune", 18.52, 73.86),
    District("Maharashtra", "Nagpur", 21.15, 79.09),
    District("Maharashtra", "Solapur", 17.66, 75.91),
    District("Uttar Pradesh", "Varanasi", 25.32, 82.97),
    District("Uttar Pradesh", "Lucknow", 26.85, 80.95),
    District("Uttar Pradesh", "Gorakhpur", 26.76, 83.37),
    District("Uttar Pradesh", "Jhansi", 25.45, 78.57),
    District("Bihar", "Patna", 25.59, 85.14),
    District("Bihar", "Gaya", 24.80, 85.00),
    District("Bihar", "Muzaffarpur", 26.12, 85.39),
    District("Rajasthan", "Jaipur", 26.91, 75.79),
    District("Rajasthan", "Jodhpur", 26.24, 73.02),
    District("Rajasthan", "Udaipur", 24.58, 73.71),
    District("Rajasthan", "Bikaner", 28.02, 73.31),
    District("Madhya Pradesh", "Bhopal", 23.26, 77.41),
    District("Madhya Pradesh", "Indore", 22.72, 75.86),
    District("Madhya Pradesh", "Jabalpur", 23.18, 79.99),
    District("Karnataka", "Bengaluru Rural", 13.23, 77.58),
    District("Karnataka", "Belagavi", 15.85, 74.50),
    District("Karnataka", "Kalaburagi", 17.33, 76.83),
    District("Tamil Nadu", "Madurai", 9.93, 78.12),
    District("Tamil Nadu", "Coimbatore", 11.02, 76.96),
    District("Tamil Nadu", "Salem", 11.66, 78.15),
    District("West Bengal", "Murshidabad", 24.18, 88.27),
    District("West Bengal", "Purulia", 23.33, 86.36),
    District("West Bengal", "Jalpaiguri", 26.52, 88.73),
    District("Gujarat", "Kutch", 23.73, 69.86),
    District("Gujarat", "Surat", 21.17, 72.83),
    District("Gujarat", "Sabarkantha", 23.60, 72.97),
    District("Andhra Pradesh", "Kurnool", 15.83, 78.04),
    District("Andhra Pradesh", "Visakhapatnam", 17.69, 83.22),
    District("Telangana", "Warangal", 17.97, 79.59),
    District("Telangana", "Nizamabad", 18.67, 78.09),
    District("Odisha", "Koraput", 18.81, 82.71),
    District("Odisha", "Sambalpur", 21.47, 83.97),
    District("Kerala", "Wayanad", 11.69, 76.08),
    District("Kerala", "Palakkad", 10.78, 76.65),
    District("Punjab", "Bathinda", 30.21, 74.95),
    District("Punjab", "Amritsar", 31.63, 74.87),
    District("Haryana", "Nuh", 28.11, 77.00),
    District("Haryana", "Hisar", 29.15, 75.72),
    District("Assam", "Barpeta", 26.32, 91.00),
    District("Assam", "Dibrugarh", 27.47, 94.91),
    District("Jharkhand", "Ranchi", 23.34, 85.31),
    District("Jharkhand", "Dumka", 24.27, 87.25),
    District("Chhattisgarh", "Bastar", 19.08, 82.03),
    District("Chhattisgarh", "Raipur", 21.25, 81.63),
    District("Uttarakhand", "Pithoragarh", 29.58, 80.22),
    District("Himachal Pradesh", "Mandi", 31.71, 76.93),
    District("Jammu and Kashmir", "Srinagar", 34.08, 74.80),
    District("Manipur", "Imphal West", 24.80, 93.94),
    District("Tripura", "West Tripura", 23.83, 91.28),
    District("Goa", "North Goa", 15.55, 73.95),
)

STATES: tuple[str, ...] = tuple(sorted({d.state for d in DISTRICTS}))
