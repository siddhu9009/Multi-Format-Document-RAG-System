def split_text(text, chunk_size=500, overlap=100):
    """
    Split text into overlapping chunks without cutting words.
    """

    if not text:
        return []

    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    words = text.split()

    chunks = []
    current_chunk = []
    current_length = 0

    for word in words:

        word_length = len(word) + 1

        if current_length + word_length > chunk_size:

            if current_chunk:
                chunk = " ".join(current_chunk)
                chunks.append(chunk)

            # Keep previous words for overlap
            overlap_words = []
            overlap_length = 0

            for previous_word in reversed(current_chunk):

                word_len = len(previous_word) + 1

                if overlap_length + word_len > overlap:
                    break

                overlap_words.insert(0, previous_word)
                overlap_length += word_len

            current_chunk = overlap_words
            current_length = overlap_length

        current_chunk.append(word)
        current_length += word_length

    # Add remaining text
    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks