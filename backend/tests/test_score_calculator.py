from app.services.score_calculator import compute_average


class TestComputeAverage:
    def test_all_fives(self):
        assert compute_average(5, 5, 5, 5, 5) == 5.0

    def test_all_ones(self):
        assert compute_average(1, 1, 1, 1, 1) == 1.0

    def test_mixed_returns_rounded_two_decimals(self):
        # (3+4+5+4+3)/5 = 19/5 = 3.8
        assert compute_average(3, 4, 5, 4, 3) == 3.8

    def test_rounding_behavior(self):
        # (1+2+3+4+5)/5 = 3.0
        assert compute_average(1, 2, 3, 4, 5) == 3.0

    def test_two_decimal_precision(self):
        # (4+4+4+5+5)/5 = 22/5 = 4.4
        assert compute_average(4, 4, 4, 5, 5) == 4.4
