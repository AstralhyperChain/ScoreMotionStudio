
import sys
from PySide6.QtWidgets import (
    QApplication,
    QMainWindow,
    QWidget,
    QLabel,
    QVBoxLayout
)
from PySide6.QtCore import Qt


class ScoreMotionStudio(QMainWindow):
    def __init__(self):
        super().__init__()

        self.setWindowTitle("ScoreMotion Studio")
        self.resize(1200, 750)

        central_widget = QWidget()
        central_widget.setStyleSheet(
            "background-color: #20232a;"
        )

        layout = QVBoxLayout(central_widget)

        title = QLabel("SCOREMOTION STUDIO")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        title.setStyleSheet(
            "font-size: 34px;"
            "font-weight: bold;"
            "color: white;"
            "padding: 30px;"
        )

        subtitle = QLabel(
            "Professional Music Video Creation Studio"
        )
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        subtitle.setStyleSheet(
            "font-size: 17px;"
            "color: #aaaaaa;"
        )

        layout.addWidget(title)
        layout.addWidget(subtitle)

        self.setCentralWidget(central_widget)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = ScoreMotionStudio()
    window.show()
    sys.exit(app.exec())
