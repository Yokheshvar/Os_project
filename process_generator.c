#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <sys/stat.h>  // For mkdir()
#include <sys/types.h> // For mkdir()
#ifdef _WIN32
#include <direct.h>    // For _mkdir() on Windows
#endif

void generate_random_byte(FILE *text_file, FILE *binary_file) {
    unsigned char byte = rand() % 256;
    fprintf(text_file, "%02X ", byte);
    fwrite(&byte, sizeof(unsigned char), 1, binary_file);
}

void generate_process(FILE *text_file, FILE *binary_file, int code_size, int data_size) {
    unsigned char process_id = rand() % 256;
    fprintf(text_file, "%02X ", process_id);
    fwrite(&process_id, sizeof(unsigned char), 1, binary_file);

    // Code segment size
    fprintf(text_file, "%02X %02X ", (code_size >> 8) & 0xFF, code_size & 0xFF);
    unsigned char code_size_bytes[2] = {(code_size >> 8) & 0xFF, code_size & 0xFF};
    fwrite(code_size_bytes, sizeof(unsigned char), 2, binary_file);

    // Code data
    for (int i = 0; i < code_size; i++)
        generate_random_byte(text_file, binary_file);

    // Data segment size
    fprintf(text_file, "%02X %02X ", (data_size >> 8) & 0xFF, data_size & 0xFF);
    unsigned char data_size_bytes[2] = {(data_size >> 8) & 0xFF, data_size & 0xFF};
    fwrite(data_size_bytes, sizeof(unsigned char), 2, binary_file);

    // Data data
    for (int i = 0; i < data_size; i++)
        generate_random_byte(text_file, binary_file);

    // End marker
    fprintf(text_file, "FF\n");
    unsigned char end_marker = 0xFF;
    fwrite(&end_marker, sizeof(unsigned char), 1, binary_file);
}

int main() {
    srand(time(NULL));

    // Create directory "processes" if it doesn't exist
#ifdef _WIN32
    _mkdir("processes");
#else
    mkdir("processes", 0777);
#endif

    int num_processes = 5;  // Number of processes to generate

    for (int i = 0; i < num_processes; i++) {
        char text_filename[64];
        char binary_filename[64];

        sprintf(text_filename, "processes/p%d.txt", i + 1);
        sprintf(binary_filename, "processes/p%d.proc", i + 1);

        FILE *text_file = fopen(text_filename, "w");
        FILE *binary_file = fopen(binary_filename, "wb");

        if (text_file == NULL || binary_file == NULL) {
            perror("Failed to open process file");
            continue;
        }

        int code_size = 16 + rand() % 64;  // 16–80 bytes
        int data_size = 64 + rand() % 128; // 64–192 bytes

        generate_process(text_file, binary_file, code_size, data_size);

        fclose(text_file);
        fclose(binary_file);

        printf("✅ Generated Process %d → %s & %s\n", i + 1, text_filename, binary_filename);
    }

    printf("\nAll processes saved in the 'processes/' directory.\n");
    return 0;
}
